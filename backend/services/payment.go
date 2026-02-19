package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/razorpay/razorpay-go"
)

type RazorpayService struct {
	client *razorpay.Client
}

func NewRazorpayService() *RazorpayService {
	keyID := os.Getenv("RAZORPAY_KEY_ID")
	keySecret := os.Getenv("RAZORPAY_KEY_SECRET")

	if keyID == "" || keySecret == "" {
		return nil
	}

	client := razorpay.NewClient(keyID, keySecret)
	return &RazorpayService{client: client}
}

// CreateOrder creates a Razorpay order for the given amount
func (s *RazorpayService) CreateOrder(amount float64, currency, receipt string, notes map[string]interface{}) (map[string]interface{}, error) {
	if s.client == nil {
		return nil, errors.New("Razorpay client not initialized")
	}

	// Convert amount to paise (smallest currency unit)
	amountInPaise := int(amount * 100)

	data := map[string]interface{}{
		"amount":   amountInPaise,
		"currency": currency,
		"receipt":  receipt,
		"notes":    notes,
	}

	order, err := s.client.Order.Create(data, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create Razorpay order: %w", err)
	}

	return order, nil
}

// VerifyPaymentSignature verifies the Razorpay payment signature
func (s *RazorpayService) VerifyPaymentSignature(orderID, paymentID, signature string) bool {
	if s.client == nil {
		return false
	}

	secret := os.Getenv("RAZORPAY_KEY_SECRET")

	// Create the string to verify: order_id|payment_id
	data := orderID + "|" + paymentID

	// Create HMAC SHA256
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(data))
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	return expectedSignature == signature
}

// FetchPayment fetches payment details from Razorpay
func (s *RazorpayService) FetchPayment(paymentID string) (map[string]interface{}, error) {
	if s.client == nil {
		return nil, errors.New("Razorpay client not initialized")
	}

	payment, err := s.client.Payment.Fetch(paymentID, nil, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch payment: %w", err)
	}

	return payment, nil
}

// CapturePayment captures an authorized payment
func (s *RazorpayService) CapturePayment(paymentID string, amount float64, currency string) (map[string]interface{}, error) {
	if s.client == nil {
		return nil, errors.New("Razorpay client not initialized")
	}

	amountInPaise := int(amount * 100)
	data := map[string]interface{}{
		"amount":   amountInPaise,
		"currency": currency,
	}

	payment, err := s.client.Payment.Capture(paymentID, amountInPaise, data, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to capture payment: %w", err)
	}

	return payment, nil
}

// RefundPayment refunds a payment
func (s *RazorpayService) RefundPayment(paymentID string, amount *float64, notes map[string]interface{}) (map[string]interface{}, error) {
	if s.client == nil {
		return nil, errors.New("Razorpay client not initialized")
	}

	var amountInPaise int
	if amount != nil {
		amountInPaise = int(*amount * 100)
	}

	data := map[string]interface{}{
		"notes": notes,
	}

	// Pass nil for the fourth parameter (optional headers)
	refund, err := s.client.Payment.Refund(paymentID, amountInPaise, data, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to refund payment: %w", err)
	}

	return refund, nil
}

// GetPaymentStatus returns the status of a payment
func (s *RazorpayService) GetPaymentStatus(paymentID string) (string, error) {
	payment, err := s.FetchPayment(paymentID)
	if err != nil {
		return "", err
	}

	status, ok := payment["status"].(string)
	if !ok {
		return "", errors.New("invalid payment status")
	}

	return status, nil
}

// ParseWebhook parses and validates a Razorpay webhook
func (s *RazorpayService) ParseWebhook(payload []byte, signature string) (map[string]interface{}, error) {
	if s.client == nil {
		return nil, errors.New("Razorpay client not initialized")
	}

	secret := os.Getenv("RAZORPAY_WEBHOOK_SECRET")
	if secret == "" {
		secret = os.Getenv("RAZORPAY_KEY_SECRET")
	}

	h := hmac.New(sha256.New, []byte(secret))
	h.Write(payload)
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	if expectedSignature != signature {
		return nil, errors.New("invalid webhook signature")
	}

	var event map[string]interface{}
	if err := json.Unmarshal(payload, &event); err != nil {
		return nil, fmt.Errorf("failed to parse webhook payload: %w", err)
	}

	return event, nil
}

// ConvertCurrency converts amount between currencies
// This is a simplified version - in production, use real-time exchange rates
func (s *RazorpayService) ConvertCurrency(amount float64, fromCurrency, toCurrency string) (float64, error) {
	// Exchange rates (should be fetched from an API in production)
	rates := map[string]float64{
		"INR": 1,
		"USD": 0.012,
		"EUR": 0.011,
		"GBP": 0.0095,
		"AUD": 0.018,
		"CAD": 0.016,
		"JPY": 1.8,
		"CHF": 0.011,
		"CNY": 0.086,
		"SGD": 0.016,
	}

	fromRate, ok := rates[fromCurrency]
	if !ok {
		return 0, fmt.Errorf("unsupported currency: %s", fromCurrency)
	}

	toRate, ok := rates[toCurrency]
	if !ok {
		return 0, fmt.Errorf("unsupported currency: %s", toCurrency)
	}

	// Convert to INR first, then to target currency
	amountInINR := amount / fromRate
	convertedAmount := amountInINR * toRate

	return convertedAmount, nil
}

// FormatAmountForRazorpay converts amount to paise for Razorpay
func FormatAmountForRazorpay(amount float64) int {
	return int(amount * 100)
}

// ParseAmountFromRazorpay converts paise back to decimal
func ParseAmountFromRazorpay(amount int) float64 {
	return float64(amount) / 100
}

// IsRazorpayCurrencySupported checks if Razorpay supports the currency
func IsRazorpayCurrencySupported(currency string) bool {
	supported := map[string]bool{
		"INR": true,
		"USD": true,
		"EUR": true,
		"GBP": true,
		"AUD": true,
		"CAD": true,
		"JPY": true,
		"SGD": true,
		"AED": true,
		"CHF": true,
	}
	return supported[currency]
}

// GetRazorpayCheckoutOptions returns options for Razorpay checkout
func (s *RazorpayService) GetRazorpayCheckoutOptions(orderID string, amount float64, currency, name, description, email, contact string, prefill map[string]string) map[string]interface{} {
	keyID := os.Getenv("RAZORPAY_KEY_ID")

	return map[string]interface{}{
		"key":         keyID,
		"amount":      FormatAmountForRazorpay(amount),
		"currency":    currency,
		"name":        name,
		"description": description,
		"order_id":    orderID,
		"prefill":     prefill,
		"theme": map[string]string{
			"color": "#1c1917",
		},
	}
}

// GenerateReceiptID generates a unique receipt ID
func GenerateReceiptID() string {
	timestamp := time.Now().Unix()
	random := strconv.Itoa(int(time.Now().Nanosecond()) % 10000)
	return fmt.Sprintf("RCP%d%s", timestamp, random)
}
