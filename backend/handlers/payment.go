package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"time"

	"pashmina-backend/config"
	"pashmina-backend/models"
	"pashmina-backend/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var (
	razorpayService   *services.RazorpayService
	shiprocketService *services.ShiprocketService
)

// GetShiprocketService returns the Shiprocket service (lazy initialization)
func GetShiprocketService() *services.ShiprocketService {
	if shiprocketService == nil {
		shiprocketService = services.NewShiprocketService()
	}
	return shiprocketService
}

// GetRazorpayService returns the Razorpay service (lazy initialization)
func GetRazorpayService() *services.RazorpayService {
	if razorpayService == nil {
		razorpayService = services.NewRazorpayService()
	}
	return razorpayService
}

// CreatePaymentIntent creates a Razorpay order for payment
func CreatePaymentIntent(c *gin.Context) {
	if GetRazorpayService() == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Payment service not available"})
		return
	}

	var input struct {
		Amount   float64                `json:"amount" binding:"required"`
		Currency string                 `json:"currency" binding:"required"`
		Receipt  string                 `json:"receipt"`
		Notes    map[string]interface{} `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate receipt if not provided
	if input.Receipt == "" {
		input.Receipt = services.GenerateReceiptID()
	}

	order, err := razorpayService.CreateOrder(input.Amount, input.Currency, input.Receipt, input.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, order)
}

// VerifyPayment verifies Razorpay payment signature
func VerifyPayment(c *gin.Context) {
	if razorpayService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Payment service not available"})
		return
	}

	var input struct {
		OrderID    string `json:"razorpay_order_id" binding:"required"`
		PaymentID  string `json:"razorpay_payment_id" binding:"required"`
		Signature  string `json:"razorpay_signature" binding:"required"`
		OrderIDInt uint   `json:"order_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify signature
	if !razorpayService.VerifyPaymentSignature(input.OrderID, input.PaymentID, input.Signature) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment signature"})
		return
	}

	// Update order in database
	var order models.Order
	if err := config.DB.First(&order, input.OrderIDInt).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Update order with payment details
	order.PaymentStatus = "paid"
	order.Status = "paid"
	order.RazorpayOrderID = input.OrderID
	order.RazorpayPaymentID = input.PaymentID
	order.RazorpaySignature = input.Signature

	if err := config.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order"})
		return
	}

	// Create payment transaction record
	transaction := models.PaymentTransaction{
		OrderID:       order.ID,
		Provider:      "razorpay",
		Amount:        order.TotalAmount,
		Currency:      order.Currency,
		Status:        "success",
		TransactionID: input.PaymentID,
		OrderIDExt:    input.OrderID,
		Signature:     input.Signature,
	}

	if err := config.DB.Create(&transaction).Error; err != nil {
		// Log error but don't fail the request
		fmt.Printf("Failed to create payment transaction: %v\n", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"order_id":   order.ID,
		"payment_id": input.PaymentID,
		"status":     "paid",
	})
}

// RazorpayWebhook handles Razorpay webhooks
func RazorpayWebhook(c *gin.Context) {
	if razorpayService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Payment service not available"})
		return
	}

	// Read body
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body"})
		return
	}

	// Get signature from header
	signature := c.GetHeader("X-Razorpay-Signature")
	if signature == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing signature"})
		return
	}

	// Parse and verify webhook
	event, err := razorpayService.ParseWebhook(body, signature)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Handle different event types
	eventType, _ := event["event"].(string)
	payload, _ := event["payload"].(map[string]interface{})

	switch eventType {
	case "payment.captured":
		payment := payload["payment"].(map[string]interface{})
		orderID := payment["order_id"].(string)

		// Update order status
		var order models.Order
		if err := config.DB.Where("razorpay_order_id = ?", orderID).First(&order).Error; err == nil {
			order.PaymentStatus = "paid"
			order.Status = "paid"
			config.DB.Save(&order)
		}

	case "payment.failed":
		payment := payload["payment"].(map[string]interface{})
		orderID := payment["order_id"].(string)

		// Update order status
		var order models.Order
		if err := config.DB.Where("razorpay_order_id = ?", orderID).First(&order).Error; err == nil {
			order.PaymentStatus = "failed"
			order.Status = "payment_failed"
			config.DB.Save(&order)
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "received"})
}

// GetPaymentStatus gets the status of a payment
func GetPaymentStatus(c *gin.Context) {
	if razorpayService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Payment service not available"})
		return
	}

	paymentID := c.Param("paymentId")
	if paymentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment ID required"})
		return
	}

	payment, err := razorpayService.FetchPayment(paymentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, payment)
}

// ProcessRefund processes a refund for a payment
func ProcessRefund(c *gin.Context) {
	if razorpayService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Payment service not available"})
		return
	}

	var input struct {
		PaymentID string   `json:"payment_id" binding:"required"`
		Amount    *float64 `json:"amount"`
		Reason    string   `json:"reason"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	notes := map[string]interface{}{
		"reason": input.Reason,
	}

	refund, err := razorpayService.RefundPayment(input.PaymentID, input.Amount, notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, refund)
}

// CalculateShippingRates gets shipping rates for an address
func CalculateShippingRates(c *gin.Context) {
	shiprocket := GetShiprocketService()
	if shiprocket == nil {
		// Return default rates if Shiprocket not configured
		c.JSON(http.StatusOK, gin.H{
			"rates": []gin.H{
				{
					"courier_name":   "Standard Shipping",
					"rate":           150,
					"currency":       "INR",
					"estimated_days": 5,
					"service_type":   "standard",
				},
				{
					"courier_name":   "Express Shipping",
					"rate":           300,
					"currency":       "INR",
					"estimated_days": 2,
					"service_type":   "express",
				},
			},
		})
		return
	}

	pickupPin := c.Query("pickup_pin")
	deliveryPin := c.Query("delivery_pin")
	weight := c.Query("weight")
	cod := c.DefaultQuery("cod", "0")

	if pickupPin == "" || deliveryPin == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pickup and delivery PIN codes required"})
		return
	}

	// Weight is in kg, convert to grams (minimum 500g)
	weightInt := 500
	if weight != "" {
		// Handle float weights like "0.5" -> 500g
		weightFloat, err := strconv.ParseFloat(weight, 64)
		if err == nil {
			weightInt = int(weightFloat * 1000)
			if weightInt < 500 {
				weightInt = 500
			}
		}
	}

	codInt := 0
	if cod != "" {
		codInt, _ = strconv.Atoi(cod)
	}

	rates, err := shiprocket.CalculateShippingRates(pickupPin, deliveryPin, weightInt, codInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"rates": rates})
}

// CreateShippingOrder creates a shipping order in Shiprocket
func CreateShippingOrder(c *gin.Context) {
	shiprocket := GetShiprocketService()
	if shiprocket == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Shipping service not available"})
		return
	}

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := shiprocket.CreateOrder(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GenerateShippingLabel generates AWB and shipping label
func GenerateShippingLabel(c *gin.Context) {
	if shiprocketService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Shipping service not available"})
		return
	}

	orderIDStr := c.Param("id")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var input struct {
		CourierID int `json:"courier_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get order from database
	var order models.Order
	if err := config.DB.Preload("Items.Product").First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Check if order is paid
	if order.PaymentStatus != "paid" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order must be paid before generating shipping label"})
		return
	}

	// Create shipping order in Shiprocket
	shippingOrder := map[string]interface{}{
		"order_id":              fmt.Sprintf("ORD%d", order.ID),
		"order_date":            order.CreatedAt.Format("2006-01-02"),
		"pickup_location":       os.Getenv("SHIPROCKET_PICKUP_LOCATION"),
		"channel_id":            "",
		"comment":               order.Notes,
		"billing_customer_name": order.ShippingName,
		"billing_last_name":     "",
		"billing_address":       order.ShippingAddress,
		"billing_address_2":     "",
		"billing_city":          order.ShippingCity,
		"billing_pincode":       order.ShippingZip,
		"billing_state":         order.ShippingState,
		"billing_country":       order.ShippingCountry,
		"billing_email":         order.ShippingEmail,
		"billing_phone":         order.ShippingPhone,
		"shipping_is_billing":   true,
		"order_items":           []map[string]interface{}{},
		"payment_method":        "Prepaid",
		"shipping_charges":      order.ShippingCost,
		"giftwrap_charges":      0,
		"transaction_charges":   0,
		"total_discount":        order.DiscountAmount,
		"sub_total":             order.TotalAmount - order.ShippingCost + order.DiscountAmount,
		"length":                10,
		"breadth":               10,
		"height":                10,
		"weight":                0.5,
	}

	// Add order items
	items := make([]map[string]interface{}, len(order.Items))
	for i, item := range order.Items {
		items[i] = map[string]interface{}{
			"name":          item.Product.Name,
			"sku":           fmt.Sprintf("SKU%d", item.ProductID),
			"units":         item.Quantity,
			"selling_price": item.Price,
			"discount":      0,
			"tax":           0,
		}
	}
	shippingOrder["order_items"] = items

	// Create order in Shiprocket
	shiprocketOrder, err := shiprocketService.CreateOrder(shippingOrder)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get shipment ID from response
	shipmentID := 0
	if data, ok := shiprocketOrder["payload"].(map[string]interface{}); ok {
		if shipmentData, ok := data["shipment_id"].(float64); ok {
			shipmentID = int(shipmentData)
		}
	}

	if shipmentID == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get shipment ID"})
		return
	}

	// Generate AWB
	awbResult, err := shiprocketService.GenerateAWB(shipmentID, input.CourierID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Extract AWB number
	awbNumber := ""
	if response, ok := awbResult["response"].(map[string]interface{}); ok {
		if data, ok := response["data"].(map[string]interface{}); ok {
			if awb, ok := data["awb_code"].(string); ok {
				awbNumber = awb
			}
		}
	}

	// Update order with tracking info
	order.TrackingNumber = awbNumber
	order.ShippingProvider = "shiprocket"
	order.Status = "processing"

	// Set estimated delivery (5-7 days from now)
	estimatedDelivery := time.Now().AddDate(0, 0, 7)
	order.EstimatedDelivery = &estimatedDelivery

	if err := config.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"awb_number":   awbNumber,
		"shipment_id":  shipmentID,
		"tracking_url": fmt.Sprintf("https://shiprocket.co/tracking/%s", awbNumber),
		"order_status": order.Status,
	})
}

// TrackShipment tracks a shipment
func TrackShipment(c *gin.Context) {
	if shiprocketService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Shipping service not available"})
		return
	}

	awb := c.Param("awb")
	if awb == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "AWB number required"})
		return
	}

	tracking, err := shiprocketService.TrackShipment(awb)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tracking)
}

// GetOrderTracking gets tracking info for an order
func GetOrderTracking(c *gin.Context) {
	orderIDStr := c.Param("id")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var order models.Order
	if err := config.DB.Preload("Items.Product").First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	trackingInfo := gin.H{
		"order_id":           order.ID,
		"status":             order.Status,
		"tracking_number":    order.TrackingNumber,
		"shipping_provider":  order.ShippingProvider,
		"estimated_delivery": order.EstimatedDelivery,
		"shipped_at":         order.ShippedAt,
		"delivered_at":       order.DeliveredAt,
	}

	// If we have an AWB and Shiprocket is configured, fetch live tracking
	if order.TrackingNumber != "" && shiprocketService != nil {
		tracking, err := shiprocketService.TrackShipment(order.TrackingNumber)
		if err == nil {
			trackingInfo["live_tracking"] = tracking
		}
	}

	c.JSON(http.StatusOK, trackingInfo)
}

// UpdateOrderStatus updates the status of an order
func UpdateOrderStatus(c *gin.Context) {
	orderIDStr := c.Param("id")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var input struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var order models.Order
	if err := config.DB.First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	order.Status = input.Status

	// Update timestamps based on status
	now := time.Now()
	switch input.Status {
	case "shipped":
		order.ShippedAt = &now
	case "delivered":
		order.DeliveredAt = &now
	}

	if err := config.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"order_id": order.ID,
		"status":   order.Status,
	})
}

// GetUserOrders gets all orders for a user
func GetUserOrders(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var orders []models.Order
	query := config.DB.Where("user_id = ?", userID).Preload("Items.Product")

	// Filter by status if provided
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	query.Order("created_at DESC").Find(&orders)

	c.JSON(http.StatusOK, orders)
}

// GetOrderDetails gets detailed information about an order
func GetOrderDetails(c *gin.Context) {
	orderIDStr := c.Param("id")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var order models.Order
	if err := config.DB.Preload("Items.Product").Preload("User").First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, order)
}

// CancelOrder cancels an order
func CancelOrder(c *gin.Context) {
	orderIDStr := c.Param("id")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var order models.Order
	if err := config.DB.Preload("Items").First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Check if order can be cancelled
	if order.Status == "shipped" || order.Status == "delivered" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot cancel shipped or delivered order"})
		return
	}

	// If order is paid, process refund
	if order.PaymentStatus == "paid" && order.RazorpayPaymentID != "" && razorpayService != nil {
		refundReason := "Order cancelled by customer"
		notes := map[string]interface{}{
			"order_id": order.ID,
			"reason":   refundReason,
		}

		_, err := razorpayService.RefundPayment(order.RazorpayPaymentID, &order.TotalAmount, notes)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process refund: " + err.Error()})
			return
		}

		order.PaymentStatus = "refunded"

		// Update transaction record
		transaction := models.PaymentTransaction{
			OrderID:       order.ID,
			Provider:      "razorpay",
			Amount:        order.TotalAmount,
			Currency:      order.Currency,
			Status:        "refunded",
			TransactionID: order.RazorpayPaymentID,
			OrderIDExt:    order.RazorpayOrderID,
			Metadata:      models.JSONB{"reason": refundReason},
		}
		config.DB.Create(&transaction)
	}

	// Cancel shipping order if it exists
	if order.TrackingNumber != "" && shiprocketService != nil {
		// Extract shipment ID from order or tracking number
		// This is simplified - in production you'd store the shipment ID
		GetShiprocketService().CancelOrder([]int{int(order.ID)}, "order_ids")
	}

	order.Status = "cancelled"

	// Restore stock for items
	for _, item := range order.Items {
		config.DB.Model(&models.Product{}).Where("id = ?", item.ProductID).
			UpdateColumn("stock", gorm.Expr("stock + ?", item.Quantity))
	}

	if err := config.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel order"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"order_id": order.ID,
		"status":   "cancelled",
		"message":  "Order cancelled successfully",
	})
}

// GetAllOrders gets all orders (for admin)
func GetAllOrders(c *gin.Context) {
	var orders []models.Order
	query := config.DB.Preload("Items.Product").Preload("User")

	// Filter by status
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Filter by payment status
	if paymentStatus := c.Query("payment_status"); paymentStatus != "" {
		query = query.Where("payment_status = ?", paymentStatus)
	}

	// Search by order ID or customer name
	if search := c.Query("search"); search != "" {
		query = query.Where("id::text ILIKE ? OR shipping_name ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Date range
	if from := c.Query("from"); from != "" {
		query = query.Where("created_at >= ?", from)
	}
	if to := c.Query("to"); to != "" {
		query = query.Where("created_at <= ?", to)
	}

	query.Order("created_at DESC").Find(&orders)

	c.JSON(http.StatusOK, orders)
}

// Add these imports at the top of handlers.go
// "gorm.io/gorm"
