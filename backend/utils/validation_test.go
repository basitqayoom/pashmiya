package utils

import (
	"testing"
)

func TestValidateEmail(t *testing.T) {
	tests := []struct {
		name    string
		email   string
		wantErr bool
	}{
		{"valid email", "test@example.com", false},
		{"valid email with subdomain", "test@sub.example.com", false},
		{"empty email", "", true},
		{"invalid email - no @", "testexample.com", true},
		{"invalid email - no domain", "test@", true},
		{"invalid email - no local part", "@example.com", true},
		{"too long email", "a" + string(make([]byte, 250)) + "@example.com", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateEmail(tt.email)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateEmail(%q) error = %v, wantErr %v", tt.email, err, tt.wantErr)
			}
		})
	}
}

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{"valid password", "password123", false},
		{"minimum length", "12345678", false},
		{"too short", "short", true},
		{"empty", "", true},
		{"too long", string(make([]byte, 73)), true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePassword(tt.password)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePassword(%q) error = %v, wantErr %v", tt.password, err, tt.wantErr)
			}
		})
	}
}

func TestValidateProductName(t *testing.T) {
	tests := []struct {
		name    string
		product string
		wantErr bool
	}{
		{"valid name", "Classic Pashmina Shawl", false},
		{"minimum length", "AB", false},
		{"empty", "", true},
		{"too short", "A", true},
		{"too long", string(make([]byte, 256)), true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateProductName(tt.product)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateProductName(%q) error = %v, wantErr %v", tt.product, err, tt.wantErr)
			}
		})
	}
}

func TestValidatePrice(t *testing.T) {
	tests := []struct {
		name    string
		price   float64
		wantErr bool
	}{
		{"valid price", 450.00, false},
		{"zero price", 0, false},
		{"negative price", -10, true},
		{"too high price", 1000001, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePrice(tt.price)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePrice(%v) error = %v, wantErr %v", tt.price, err, tt.wantErr)
			}
		})
	}
}

func TestValidateStock(t *testing.T) {
	tests := []struct {
		name    string
		stock   int
		wantErr bool
	}{
		{"valid stock", 100, false},
		{"zero stock", 0, false},
		{"negative stock", -5, true},
		{"too high stock", 100001, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateStock(tt.stock)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateStock(%v) error = %v, wantErr %v", tt.stock, err, tt.wantErr)
			}
		})
	}
}

func TestValidateQuantity(t *testing.T) {
	tests := []struct {
		name     string
		quantity int
		wantErr  bool
	}{
		{"valid quantity", 5, false},
		{"minimum quantity", 1, false},
		{"zero quantity", 0, true},
		{"negative quantity", -1, true},
		{"too high quantity", 101, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateQuantity(tt.quantity)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateQuantity(%v) error = %v, wantErr %v", tt.quantity, err, tt.wantErr)
			}
		})
	}
}

func TestValidateSortColumn(t *testing.T) {
	tests := []struct {
		name    string
		sort    string
		want    string
		wantErr bool
	}{
		{"valid - id", "id", "id", false},
		{"valid - name", "name", "name", false},
		{"valid - price", "price", "price", false},
		{"empty returns default", "", "id", false},
		{"invalid column", "invalid", "", true},
		{"SQL injection attempt", "id; DROP TABLE products", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ValidateSortColumn(tt.sort)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateSortColumn(%q) error = %v, wantErr %v", tt.sort, err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("ValidateSortColumn(%q) = %q, want %q", tt.sort, got, tt.want)
			}
		})
	}
}

func TestValidateOrderDirection(t *testing.T) {
	tests := []struct {
		name    string
		order   string
		want    string
		wantErr bool
	}{
		{"valid - asc", "asc", "asc", false},
		{"valid - desc", "desc", "desc", false},
		{"valid - uppercase", "ASC", "asc", false},
		{"empty returns default", "", "desc", false},
		{"invalid direction", "random", "", true},
		{"SQL injection attempt", "desc; DROP TABLE orders", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ValidateOrderDirection(tt.order)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateOrderDirection(%q) error = %v, wantErr %v", tt.order, err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("ValidateOrderDirection(%q) = %q, want %q", tt.order, got, tt.want)
			}
		})
	}
}

func TestValidateRating(t *testing.T) {
	tests := []struct {
		name    string
		rating  int
		wantErr bool
	}{
		{"valid - 1", 1, false},
		{"valid - 5", 5, false},
		{"valid - 3", 3, false},
		{"zero", 0, true},
		{"too high", 6, true},
		{"negative", -1, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateRating(tt.rating)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateRating(%v) error = %v, wantErr %v", tt.rating, err, tt.wantErr)
			}
		})
	}
}

func TestValidatePagination(t *testing.T) {
	tests := []struct {
		name      string
		page      int
		limit     int
		wantPage  int
		wantLimit int
	}{
		{"valid", 1, 20, 1, 20},
		{"zero page", 0, 20, 1, 20},
		{"negative page", -1, 20, 1, 20},
		{"zero limit", 1, 0, 1, 20},
		{"negative limit", 1, -5, 1, 20},
		{"limit too high", 1, 200, 1, 100},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotPage, gotLimit := ValidatePagination(tt.page, tt.limit)
			if gotPage != tt.wantPage || gotLimit != tt.wantLimit {
				t.Errorf("ValidatePagination(%v, %v) = (%v, %v), want (%v, %v)",
					tt.page, tt.limit, gotPage, gotLimit, tt.wantPage, tt.wantLimit)
			}
		})
	}
}

func TestSanitizeString(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		maxLen   int
		expected string
	}{
		{"no change", "hello", 10, "hello"},
		{"trims spaces", "  hello  ", 10, "hello"},
		{"truncates", "hello world", 5, "hello"},
		{"empty", "", 10, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := SanitizeString(tt.input, tt.maxLen)
			if got != tt.expected {
				t.Errorf("SanitizeString(%q, %d) = %q, want %q", tt.input, tt.maxLen, got, tt.expected)
			}
		})
	}
}
