package utils

import (
	"fmt"
	"net/url"
	"regexp"
	"strings"
)

var (
	emailRegex  = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	phoneRegex  = regexp.MustCompile(`^\+?[1-9]\d{6,14}$`)
	postalRegex = regexp.MustCompile(`^[a-zA-Z0-9\s-]{3,10}$`)
	slugRegex   = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
)

var allowedSortColumns = map[string]bool{
	"id":          true,
	"name":        true,
	"price":       true,
	"created_at":  true,
	"updated_at":  true,
	"stock":       true,
	"is_featured": true,
	"sort_order":  true,
	"status":      true,
}

var allowedOrderDirections = map[string]bool{
	"asc":  true,
	"desc": true,
}

func ValidateEmail(email string) error {
	if email == "" {
		return fmt.Errorf("email is required")
	}
	if len(email) > 255 {
		return fmt.Errorf("email is too long")
	}
	if !emailRegex.MatchString(email) {
		return fmt.Errorf("invalid email format")
	}
	return nil
}

func ValidatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}
	if len(password) > 72 {
		return fmt.Errorf("password is too long")
	}
	return nil
}

func ValidatePhone(phone string) error {
	if phone == "" {
		return nil
	}
	if !phoneRegex.MatchString(phone) {
		return fmt.Errorf("invalid phone format")
	}
	return nil
}

func ValidateName(name string) error {
	if name == "" {
		return fmt.Errorf("name is required")
	}
	if len(name) > 100 {
		return fmt.Errorf("name is too long")
	}
	return nil
}

func ValidateProductName(name string) error {
	if name == "" {
		return fmt.Errorf("product name is required")
	}
	if len(name) < 2 {
		return fmt.Errorf("product name must be at least 2 characters")
	}
	if len(name) > 255 {
		return fmt.Errorf("product name is too long")
	}
	return nil
}

func ValidatePrice(price float64) error {
	if price < 0 {
		return fmt.Errorf("price cannot be negative")
	}
	if price > 1000000 {
		return fmt.Errorf("price is too high")
	}
	return nil
}

func ValidateStock(stock int) error {
	if stock < 0 {
		return fmt.Errorf("stock cannot be negative")
	}
	if stock > 100000 {
		return fmt.Errorf("stock value is too high")
	}
	return nil
}

func ValidateQuantity(quantity int) error {
	if quantity <= 0 {
		return fmt.Errorf("quantity must be greater than 0")
	}
	if quantity > 100 {
		return fmt.Errorf("quantity cannot exceed 100")
	}
	return nil
}

func ValidateSortColumn(sort string) (string, error) {
	if sort == "" {
		return "id", nil
	}
	sort = strings.ToLower(sort)
	if !allowedSortColumns[sort] {
		return "", fmt.Errorf("invalid sort column: %s", sort)
	}
	return sort, nil
}

func ValidateOrderDirection(order string) (string, error) {
	if order == "" {
		return "desc", nil
	}
	order = strings.ToLower(order)
	if !allowedOrderDirections[order] {
		return "", fmt.Errorf("invalid order direction: %s", order)
	}
	return order, nil
}

func ValidatePostalCode(postalCode string) error {
	if postalCode == "" {
		return fmt.Errorf("postal code is required")
	}
	if !postalRegex.MatchString(postalCode) {
		return fmt.Errorf("invalid postal code format")
	}
	return nil
}

func ValidateAddress(address, city, state, country string) error {
	if address == "" {
		return fmt.Errorf("address is required")
	}
	if len(address) > 500 {
		return fmt.Errorf("address is too long")
	}
	if city == "" {
		return fmt.Errorf("city is required")
	}
	if len(city) > 100 {
		return fmt.Errorf("city name is too long")
	}
	if state == "" {
		return fmt.Errorf("state is required")
	}
	if len(state) > 100 {
		return fmt.Errorf("state name is too long")
	}
	if country == "" {
		return fmt.Errorf("country is required")
	}
	if len(country) > 100 {
		return fmt.Errorf("country name is too long")
	}
	return nil
}

func ValidateURL(urlStr string) error {
	if urlStr == "" {
		return nil
	}
	_, err := url.ParseRequestURI(urlStr)
	if err != nil {
		return fmt.Errorf("invalid URL format")
	}
	return nil
}

func ValidateSlug(slug string) error {
	if slug == "" {
		return fmt.Errorf("slug is required")
	}
	if len(slug) > 100 {
		return fmt.Errorf("slug is too long")
	}
	if !slugRegex.MatchString(slug) {
		return fmt.Errorf("invalid slug format (use lowercase letters, numbers, and hyphens)")
	}
	return nil
}

func ValidateRating(rating int) error {
	if rating < 1 || rating > 5 {
		return fmt.Errorf("rating must be between 1 and 5")
	}
	return nil
}

func ValidateCouponCode(code string) error {
	if code == "" {
		return fmt.Errorf("coupon code is required")
	}
	if len(code) < 3 || len(code) > 50 {
		return fmt.Errorf("coupon code must be between 3 and 50 characters")
	}
	if !regexp.MustCompile(`^[A-Z0-9]+$`).MatchString(code) {
		return fmt.Errorf("coupon code must contain only uppercase letters and numbers")
	}
	return nil
}

func SanitizeString(input string, maxLength int) string {
	input = strings.TrimSpace(input)
	if len(input) > maxLength {
		input = input[:maxLength]
	}
	return input
}

func ValidatePagination(page, limit int) (int, int) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	return page, limit
}

func ValidateOrderStatus(status string) error {
	validStatuses := map[string]bool{
		"pending_payment": true,
		"confirmed":       true,
		"paid":            true,
		"processing":      true,
		"shipped":         true,
		"delivered":       true,
		"cancelled":       true,
		"refunded":        true,
		"payment_failed":  true,
	}
	if !validStatuses[status] {
		return fmt.Errorf("invalid order status: %s", status)
	}
	return nil
}

func ValidatePaymentStatus(status string) error {
	validStatuses := map[string]bool{
		"pending":  true,
		"paid":     true,
		"failed":   true,
		"refunded": true,
	}
	if !validStatuses[status] {
		return fmt.Errorf("invalid payment status: %s", status)
	}
	return nil
}
