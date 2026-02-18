package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type ShiprocketService struct {
	baseURL     string
	email       string
	password    string
	token       string
	tokenExpiry time.Time
	httpClient  *http.Client
}

// NewShiprocketService creates a new Shiprocket service instance
func NewShiprocketService() *ShiprocketService {
	email := os.Getenv("SHIPROCKET_EMAIL")
	password := os.Getenv("SHIPROCKET_PASSWORD")

	// Debug output
	fmt.Printf("Shiprocket DEBUG: email = '%s', password length = %d\n", email, len(password))

	// Check if credentials are provided
	if email == "" || password == "" {
		fmt.Println("Shiprocket: No credentials provided, using defaults")
		return nil
	}

	fmt.Printf("Shiprocket: Creating service for %s\n", email)
	return &ShiprocketService{
		baseURL:    "https://apiv2.shiprocket.in/v1/external",
		email:      email,
		password:   password,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// authenticate gets or refreshes the Shiprocket auth token
func (s *ShiprocketService) authenticate() error {
	// Check if token is still valid
	if s.token != "" && time.Now().Before(s.tokenExpiry) {
		return nil
	}

	url := s.baseURL + "/auth/login"

	var payload map[string]string
	payload = map[string]string{
		"email":    s.email,
		"password": s.password,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	resp, err := s.httpClient.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("authentication failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("authentication failed: %s", string(body))
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return err
	}

	token, ok := result["token"].(string)
	if !ok {
		return errors.New("invalid token response")
	}

	s.token = token
	s.tokenExpiry = time.Now().Add(9 * 24 * time.Hour) // Token valid for 10 days

	return nil
}

// makeRequest makes an authenticated request to Shiprocket
func (s *ShiprocketService) makeRequest(method, endpoint string, payload interface{}) (*http.Response, error) {
	if err := s.authenticate(); err != nil {
		return nil, err
	}

	url := s.baseURL + endpoint

	var body io.Reader
	if payload != nil {
		jsonData, err := json.Marshal(payload)
		if err != nil {
			return nil, err
		}
		body = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, url, body)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+s.token)
	req.Header.Set("Content-Type", "application/json")

	return s.httpClient.Do(req)
}

// CalculateShippingRates gets shipping rates for a delivery
func (s *ShiprocketService) CalculateShippingRates(pickupPin, deliveryPin string, weight, cod int) ([]map[string]interface{}, error) {
	if s == nil {
		return nil, errors.New("Shiprocket service not initialized")
	}

	url := fmt.Sprintf("/courier/serviceability/?pickup_postcode=%s&delivery_postcode=%s&weight=%d&cod=%d",
		pickupPin, deliveryPin, weight, cod)

	resp, err := s.makeRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to get rates: %s", string(body))
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	// Check for error status
	if status, ok := result["status"].(float64); ok && status != 200 {
		if msg, ok := result["message"].(string); ok {
			return nil, fmt.Errorf("API error: %s", msg)
		}
	}

	// Extract available couriers from nested data
	data, ok := result["data"].(map[string]interface{})
	if !ok {
		return []map[string]interface{}{}, nil
	}

	couriers, ok := data["available_courier_companies"].([]interface{})
	if !ok {
		return []map[string]interface{}{}, nil
	}

	rates := make([]map[string]interface{}, 0)
	for _, c := range couriers {
		if courier, ok := c.(map[string]interface{}); ok {
			// Extract relevant fields
			rate := map[string]interface{}{
				"courier_name":       courier["courier_name"],
				"rate":               courier["rate"],
				"currency":           "INR",
				"estimated_days":     courier["estimated_delivery_days"],
				"service_type":       courier["courier_type"],
				"courier_company_id": courier["courier_company_id"],
			}
			rates = append(rates, rate)
		}
	}

	return rates, nil
}

// CreateOrder creates a shipping order
func (s *ShiprocketService) CreateOrder(orderData map[string]interface{}) (map[string]interface{}, error) {
	if s == nil {
		return nil, errors.New("Shiprocket service not initialized")
	}

	resp, err := s.makeRequest("POST", "/orders/create/adhoc", orderData)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to create order: %s", string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return result, nil
}

// GenerateAWB generates Air Waybill (tracking number)
func (s *ShiprocketService) GenerateAWB(shipmentID int, courierID int) (map[string]interface{}, error) {
	if s == nil {
		return nil, errors.New("Shiprocket service not initialized")
	}

	payload := map[string]interface{}{
		"shipment_id": shipmentID,
		"courier_id":  courierID,
	}

	resp, err := s.makeRequest("POST", "/courier/assign/awb", payload)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to generate AWB: %s", string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return result, nil
}

// DownloadLabel downloads shipping label
func (s *ShiprocketService) DownloadLabel(shipmentIDs []int) ([]byte, error) {
	if s == nil {
		return nil, errors.New("Shiprocket service not initialized")
	}

	payload := map[string]interface{}{
		"shipment_id": shipmentIDs,
	}

	resp, err := s.makeRequest("POST", "/courier/generate/label", payload)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to generate label: %s", string(body))
	}

	return io.ReadAll(resp.Body)
}

// TrackShipment tracks a shipment
func (s *ShiprocketService) TrackShipment(awb string) (map[string]interface{}, error) {
	if s == nil {
		return nil, errors.New("Shiprocket service not initialized")
	}

	url := fmt.Sprintf("/courier/track/awb/%s", awb)

	resp, err := s.makeRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to track shipment: %s", string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return result, nil
}

// CancelOrder cancels an order
func (s *ShiprocketService) CancelOrder(ids []int, type_ string) error {
	if s == nil {
		return errors.New("Shiprocket service not initialized")
	}

	payload := map[string]interface{}{
		"ids":  ids,
		"type": type_, // "order_ids" or "shipment_ids"
	}

	resp, err := s.makeRequest("POST", "/orders/cancel", payload)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to cancel order: %s", string(body))
	}

	return nil
}

// GetPickupLocations gets available pickup locations
func (s *ShiprocketService) GetPickupLocations() ([]map[string]interface{}, error) {
	if s == nil {
		return nil, errors.New("Shiprocket service not initialized")
	}

	resp, err := s.makeRequest("GET", "/settings/company/pickup", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get pickup locations: %s", string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	data, ok := result["data"].([]map[string]interface{})
	if !ok {
		return []map[string]interface{}{}, nil
	}

	return data, nil
}

// Helper function to convert weight to grams (Shiprocket uses grams)
func ConvertWeightToGrams(weightKg float64) int {
	return int(weightKg * 1000)
}

// Helper function to check if a country is supported by Shiprocket
func IsShiprocketCountrySupported(countryCode string) bool {
	// Shiprocket primarily supports India domestic shipping
	// For international, they have limited support
	supported := map[string]bool{
		"IN": true, // India (domestic)
		"US": true, // USA
		"UK": true, // United Kingdom
		"AE": true, // UAE
		"SG": true, // Singapore
		"CA": true, // Canada
		"AU": true, // Australia
		"DE": true, // Germany
	}
	return supported[countryCode]
}
