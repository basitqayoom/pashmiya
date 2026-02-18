package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

type StringArray []string

func (a StringArray) Value() (driver.Value, error) {
	if a == nil {
		return nil, nil
	}
	return json.Marshal(a)
}

func (a *StringArray) Scan(value interface{}) error {
	if value == nil {
		*a = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		str, ok := value.(string)
		if !ok {
			return nil
		}
		bytes = []byte(str)
	}

	return json.Unmarshal(bytes, a)
}

type JSONB map[string]interface{}

func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		str, ok := value.(string)
		if !ok {
			return nil
		}
		bytes = []byte(str)
	}

	return json.Unmarshal(bytes, j)
}

type User struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	Email       string         `gorm:"uniqueIndex" json:"email"`
	Password    string         `gorm:"not null" json:"-"`
	Name        string         `json:"name"`
	Phone       string         `gorm:"index" json:"phone"`
	Role        string         `gorm:"default:user" json:"role"`
	FirebaseUID string         `gorm:"index" json:"firebase_uid"`
	Provider    string         `gorm:"default:email" json:"provider"`
}

type Category struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	Name        string         `gorm:"uniqueIndex;not null" json:"name"`
	Slug        string         `gorm:"uniqueIndex" json:"slug"`
	Description string         `json:"description"`
	Image       string         `json:"image"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	Products    []Product      `gorm:"foreignKey:CategoryID" json:"products,omitempty"`
}

type Product struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	Name        string         `gorm:"not null" json:"name"`
	Price       float64        `gorm:"not null" json:"price"`
	Description string         `json:"description"`
	Image       string         `json:"image"`
	CategoryID  uint           `json:"category_id"`
	Category    Category       `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Colors      StringArray    `gorm:"type:jsonb" json:"colors"`
	Sizes       StringArray    `gorm:"type:jsonb" json:"sizes"`
	Stock       int            `gorm:"default:0" json:"stock"`
	IsFeatured  bool           `gorm:"default:false" json:"is_featured"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
}

type Order struct {
	ID              uint        `gorm:"primarykey" json:"id"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`
	UserID          uint        `json:"user_id"`
	User            User        `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Status          string      `gorm:"default:pending_payment" json:"status"`
	TotalAmount     float64     `json:"total_amount"`
	DiscountAmount  float64     `json:"discount_amount"`
	ShippingCost    float64     `json:"shipping_cost"`
	TaxAmount       float64     `json:"tax_amount"`
	Currency        string      `gorm:"default:INR" json:"currency"`
	Items           []OrderItem `gorm:"foreignKey:OrderID" json:"items"`
	ShippingName    string      `json:"shipping_name"`
	ShippingEmail   string      `json:"shipping_email"`
	ShippingAddress string      `json:"shipping_address"`
	ShippingCity    string      `json:"shipping_city"`
	ShippingState   string      `json:"shipping_state"`
	ShippingCountry string      `json:"shipping_country"`
	ShippingZip     string      `json:"shipping_zip"`
	ShippingPhone   string      `json:"shipping_phone"`
	CouponCode      string      `json:"coupon_code"`
	Notes           string      `gorm:"type:text" json:"notes"`
	// Payment Fields
	PaymentMethod   string `json:"payment_method"`
	PaymentIntentID string `json:"payment_intent_id"`
	PaymentStatus   string `gorm:"default:pending" json:"payment_status"`
	// Shipping Fields
	ShippingProvider  string     `json:"shipping_provider"`
	ShippingLabelURL  string     `json:"shipping_label_url"`
	TrackingNumber    string     `json:"tracking_number"`
	EstimatedDelivery *time.Time `json:"estimated_delivery,omitempty"`
	ShippedAt         *time.Time `json:"shipped_at,omitempty"`
	DeliveredAt       *time.Time `json:"delivered_at,omitempty"`
	// Razorpay specific
	RazorpayOrderID   string `json:"razorpay_order_id"`
	RazorpayPaymentID string `json:"razorpay_payment_id"`
	RazorpaySignature string `json:"razorpay_signature"`
}

type OrderItem struct {
	ID        uint    `gorm:"primarykey" json:"id"`
	OrderID   uint    `json:"order_id"`
	Order     Order   `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	ProductID uint    `json:"product_id"`
	Product   Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
	Color     string  `json:"color"`
	Size      string  `json:"size"`
}

type PaymentTransaction struct {
	ID            uint      `gorm:"primarykey" json:"id"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	OrderID       uint      `json:"order_id"`
	Order         Order     `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	Provider      string    `json:"provider"` // "razorpay"
	Amount        float64   `json:"amount"`
	Currency      string    `json:"currency"`
	Status        string    `json:"status"`         // "pending", "success", "failed", "refunded"
	TransactionID string    `json:"transaction_id"` // Razorpay payment ID
	OrderIDExt    string    `json:"order_id_ext"`   // Razorpay order ID
	Signature     string    `json:"signature"`
	FailureReason string    `json:"failure_reason,omitempty"`
	Metadata      JSONB     `gorm:"type:jsonb" json:"metadata,omitempty"`
}

type ShippingRate struct {
	ID            uint      `gorm:"primarykey" json:"id"`
	CreatedAt     time.Time `json:"created_at"`
	Provider      string    `json:"provider"` // "shiprocket", "dhl"
	CourierName   string    `json:"courier_name"`
	ServiceType   string    `json:"service_type"`
	Rate          float64   `json:"rate"`
	Currency      string    `json:"currency"`
	EstimatedDays int       `json:"estimated_days"`
	IsAvailable   bool      `json:"is_available"`
	Weight        float64   `json:"weight"`
	Dimensions    JSONB     `gorm:"type:jsonb" json:"dimensions,omitempty"`
	FromCountry   string    `json:"from_country"`
	ToCountry     string    `json:"to_country"`
	ValidUntil    time.Time `json:"valid_until"`
}

type ShippingZone struct {
	ID            uint        `gorm:"primarykey" json:"id"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"`
	Name          string      `json:"name"`
	Countries     StringArray `gorm:"type:jsonb" json:"countries"`
	BaseRate      float64     `json:"base_rate"`
	RatePerKg     float64     `json:"rate_per_kg"`
	FreeThreshold float64     `json:"free_threshold"`
	IsActive      bool        `gorm:"default:true" json:"is_active"`
}

type Newsletter struct {
	ID         uint      `gorm:"primarykey" json:"id"`
	CreatedAt  time.Time `json:"created_at"`
	Email      string    `gorm:"uniqueIndex;not null" json:"email"`
	Subscribed bool      `gorm:"default:true" json:"subscribed"`
}

type PageContent struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Page      string    `gorm:"not null;index" json:"page"`
	Section   string    `gorm:"not null" json:"section"`
	Title     string    `json:"title"`
	Content   string    `gorm:"type:text" json:"content"`
	Image     string    `json:"image"`
	Metadata  string    `gorm:"type:jsonb" json:"metadata,omitempty"`
}

type Notification struct {
	ID            uint           `gorm:"primarykey" json:"id"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	UserID        *uint          `json:"user_id"`
	User          User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Type          string         `gorm:"not null;index" json:"type"`
	Channel       string         `gorm:"not null" json:"channel"`
	Title         string         `gorm:"not null" json:"title"`
	Message       string         `gorm:"type:text" json:"message"`
	Data          StringArray    `gorm:"type:jsonb" json:"data,omitempty"`
	Status        string         `gorm:"default:pending" json:"status"`
	SentAt        *time.Time     `json:"sent_at,omitempty"`
	ReadAt        *time.Time     `json:"read_at,omitempty"`
	FailureReason string         `json:"failure_reason,omitempty"`
}

type NotificationPreference struct {
	ID             uint      `gorm:"primarykey" json:"id"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	UserID         uint      `gorm:"uniqueIndex" json:"user_id"`
	OrderCreated   bool      `gorm:"default:true" json:"order_created"`
	OrderShipped   bool      `gorm:"default:true" json:"order_shipped"`
	OrderDelivered bool      `gorm:"default:true" json:"order_delivered"`
	OrderStatus    bool      `gorm:"default:true" json:"order_status"`
	LowStock       bool      `gorm:"default:true" json:"low_stock"`
	ProductUpdates bool      `gorm:"default:false" json:"product_updates"`
	Newsletter     bool      `gorm:"default:true" json:"newsletter"`
	Marketing      bool      `gorm:"default:false" json:"marketing"`
	EmailEnabled   bool      `gorm:"default:true" json:"email_enabled"`
	SMSEnabled     bool      `gorm:"default:false" json:"sms_enabled"`
	PushEnabled    bool      `gorm:"default:true" json:"push_enabled"`
}

type AdminNotificationSetting struct {
	ID                  uint      `gorm:"primarykey" json:"id"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
	AdminEmail          string    `gorm:"not null" json:"admin_email"`
	AdminPhone          string    `json:"admin_phone"`
	NotifyOnOrder       bool      `gorm:"default:true" json:"notify_on_order"`
	NotifyOnLowStock    bool      `gorm:"default:true" json:"notify_on_low_stock"`
	NotifyOnNewCustomer bool      `gorm:"default:true" json:"notify_on_new_customer"`
	NotifyOnReview      bool      `gorm:"default:false" json:"notify_on_review"`
	EmailEnabled        bool      `gorm:"default:true" json:"email_enabled"`
	SMSEnabled          bool      `gorm:"default:false" json:"sms_enabled"`
}

type NotificationTemplate struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Type      string    `gorm:"uniqueIndex;not null" json:"type"`
	Channel   string    `gorm:"not null" json:"channel"`
	Subject   string    `json:"subject,omitempty"`
	Title     string    `json:"title"`
	Body      string    `gorm:"type:text" json:"body"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
}

type PushSubscription struct {
	ID        uint       `gorm:"primarykey" json:"id"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	UserID    uint       `gorm:"index;not null" json:"user_id"`
	Endpoint  string     `gorm:"not null" json:"endpoint"`
	P256DH    string     `gorm:"not null" json:"p256dh"`
	Auth      string     `gorm:"not null" json:"auth"`
	Expiries  *time.Time `json:"expiries,omitempty"`
}

type Coupon struct {
	ID                  uint        `gorm:"primarykey" json:"id"`
	CreatedAt           time.Time   `json:"created_at"`
	UpdatedAt           time.Time   `json:"updated_at"`
	Code                string      `gorm:"uniqueIndex;not null" json:"code"`
	Description         string      `json:"description"`
	DiscountType        string      `gorm:"not null" json:"discount_type"`
	DiscountValue       float64     `gorm:"not null" json:"discount_value"`
	MinOrderAmount      float64     `json:"min_order_amount"`
	MaxDiscountAmount   float64     `json:"max_discount_amount"`
	ValidFrom           time.Time   `json:"valid_from"`
	ValidUntil          time.Time   `json:"valid_until"`
	UsageLimit          int         `json:"usage_limit"`
	UsedCount           int         `gorm:"default:0" json:"used_count"`
	IsActive            bool        `gorm:"default:true" json:"is_active"`
	ApplicableCountries StringArray `gorm:"type:jsonb" json:"applicable_countries"`
}

func (c *Coupon) IsValid() bool {
	if !c.IsActive {
		return false
	}
	now := time.Now()
	if c.ValidFrom.After(now) {
		return false
	}
	if c.ValidUntil.Before(now) {
		return false
	}
	if c.UsageLimit > 0 && c.UsedCount >= c.UsageLimit {
		return false
	}
	return true
}

type Review struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	ProductID    uint           `gorm:"not null;index" json:"product_id"`
	Product      Product        `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	UserID       uint           `gorm:"not null" json:"user_id"`
	User         User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Rating       int            `gorm:"not null" json:"rating"`
	Title        string         `json:"title"`
	Comment      string         `gorm:"type:text" json:"comment"`
	IsVerified   bool           `gorm:"default:false" json:"is_verified"`
	IsApproved   bool           `gorm:"default:true" json:"is_approved"`
	HelpfulCount int            `gorm:"default:0" json:"helpful_count"`
}

type Wishlist struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ProductID uint      `gorm:"not null;index" json:"product_id"`
	Product   Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

type AuthSettings struct {
	ID                 uint   `gorm:"primarykey" json:"id"`
	EnableEmailAuth    bool   `gorm:"default:true" json:"enable_email_auth"`
	EnableGoogleAuth   bool   `gorm:"default:false" json:"enable_google_auth"`
	EnablePhoneAuth    bool   `gorm:"default:false" json:"enable_phone_auth"`
	GoogleClientID     string `json:"google_client_id"`
	GoogleClientSecret string `json:"google_client_secret"`
}

type Address struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	UserID       uint           `gorm:"not null;index" json:"user_id"`
	User         User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Type         string         `gorm:"default:shipping" json:"type"`
	IsDefault    bool           `gorm:"default:false" json:"is_default"`
	Name         string         `json:"name"`
	Phone        string         `json:"phone"`
	AddressLine1 string         `json:"address_line1"`
	AddressLine2 string         `json:"address_line2"`
	City         string         `json:"city"`
	State        string         `json:"state"`
	PostalCode   string         `json:"postal_code"`
	Country      string         `gorm:"not null" json:"country"`
	Landmark     string         `json:"landmark"`
}

type Catalogue struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	Name        string         `gorm:"not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	Image       string         `json:"image"`
	Status      bool           `gorm:"default:true" json:"status"`
	SortOrder   int            `gorm:"default:0" json:"sort_order"`
	Products    []Product      `gorm:"many2many:catalogue_products;" json:"products,omitempty"`
}

type CatalogueWithProducts struct {
	Catalogue
	Products []Product `json:"products"`
}

type CreateCatalogueInput struct {
	Name        string         `json:"name" binding:"required"`
	Description string         `json:"description"`
	Image       string         `json:"image"`
	Status      bool           `json:"status"`
	SortOrder   int            `json:"sort_order"`
	Products    []ProductInput `json:"products"`
}

type ProductInput struct {
	ID          uint     `json:"id"`
	Name        string   `json:"name"`
	Price       float64  `json:"price"`
	Description string   `json:"description"`
	Image       string   `json:"image"`
	CategoryID  uint     `json:"category_id"`
	Colors      []string `json:"colors"`
	Sizes       []string `json:"sizes"`
	Stock       int      `json:"stock"`
	IsFeatured  bool     `json:"is_featured"`
	IsActive    bool     `json:"is_active"`
}
