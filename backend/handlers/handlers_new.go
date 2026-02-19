package handlers

import (
	"fmt"
	"net/http"
	"os"
	"strconv"

	"pashmina-backend/config"
	"pashmina-backend/middleware"
	"pashmina-backend/models"
	"pashmina-backend/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *gin.Context) {
	var input struct {
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=8"`
		Phone    string `json:"phone"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := utils.ValidateEmail(input.Email); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := utils.ValidatePassword(input.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existingUser models.User
	if err := config.DB.Where("email = ?", input.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process registration"})
		return
	}

	user := models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hashedPassword),
		Phone:    input.Phone,
		Role:     "user",
		Provider: "email",
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	token, err := middleware.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	utils.Info("User registered", map[string]interface{}{
		"user_id": user.ID,
		"email":   user.Email,
	})

	c.JSON(http.StatusCreated, gin.H{
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
		"token": token,
	})
}

func Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func RefreshToken(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	email, _ := c.Get("user_email")
	role, _ := c.Get("user_role")

	token, err := middleware.GenerateToken(userID.(uint), email.(string), role.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

func UpdateCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input struct {
		Name  string `json:"name"`
		Phone string `json:"phone"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if input.Name != "" {
		user.Name = input.Name
	}
	if input.Phone != "" {
		user.Phone = input.Phone
	}

	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":    user.ID,
		"name":  user.Name,
		"email": user.Email,
		"role":  user.Role,
		"phone": user.Phone,
	})
}

func SubscribeNewsletter(c *gin.Context) {
	var input struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var newsletter models.Newsletter
	if err := config.DB.Where("email = ?", input.Email).First(&newsletter).Error; err == nil {
		if newsletter.Subscribed {
			c.JSON(http.StatusOK, gin.H{"message": "Already subscribed"})
			return
		}
		newsletter.Subscribed = true
		config.DB.Save(&newsletter)
		c.JSON(http.StatusOK, gin.H{"message": "Resubscribed successfully"})
		return
	}

	newsletter = models.Newsletter{
		Email:      input.Email,
		Subscribed: true,
	}

	if err := config.DB.Create(&newsletter).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to subscribe"})
		return
	}

	utils.Info("Newsletter subscription", map[string]interface{}{"email": input.Email})

	c.JSON(http.StatusCreated, gin.H{"message": "Subscribed successfully"})
}

func GetAddresses(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var addresses []models.Address
	config.DB.Where("user_id = ?", userID).Order("is_default DESC, created_at DESC").Find(&addresses)

	c.JSON(http.StatusOK, addresses)
}

func CreateAddress(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input models.Address
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := utils.ValidateAddress(input.AddressLine1, input.City, input.State, input.Country); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := utils.ValidatePostalCode(input.PostalCode); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.UserID = userID.(uint)

	if input.IsDefault {
		config.DB.Model(&models.Address{}).Where("user_id = ?", userID).Update("is_default", false)
	}

	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create address"})
		return
	}

	c.JSON(http.StatusCreated, input)
}

func UpdateAddress(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	addressID := c.Param("id")

	var address models.Address
	if err := config.DB.Where("id = ? AND user_id = ?", addressID, userID).First(&address).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if isDefault, ok := updates["is_default"].(bool); ok && isDefault {
		config.DB.Model(&models.Address{}).Where("user_id = ?", userID).Update("is_default", false)
	}

	config.DB.Model(&address).Updates(updates)
	config.DB.First(&address, address.ID)

	c.JSON(http.StatusOK, address)
}

func DeleteAddress(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	addressID := c.Param("id")

	result := config.DB.Where("id = ? AND user_id = ?", addressID, userID).Delete(&models.Address{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Address deleted"})
}

func GetWishlist(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var wishlist []models.Wishlist
	config.DB.Where("user_id = ?", userID).Preload("Product.Category").Find(&wishlist)

	c.JSON(http.StatusOK, wishlist)
}

func AddToWishlist(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input struct {
		ProductID uint `json:"product_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existing models.Wishlist
	if err := config.DB.Where("user_id = ? AND product_id = ?", userID, input.ProductID).First(&existing).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{"message": "Already in wishlist"})
		return
	}

	wishlist := models.Wishlist{
		UserID:    userID.(uint),
		ProductID: input.ProductID,
	}

	if err := config.DB.Create(&wishlist).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add to wishlist"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Added to wishlist"})
}

func RemoveFromWishlist(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	productID := c.Param("productId")

	result := config.DB.Where("user_id = ? AND product_id = ?", userID, productID).Delete(&models.Wishlist{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item not found in wishlist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from wishlist"})
}

func GetUserReviews(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var reviews []models.Review
	config.DB.Where("user_id = ?", userID).Preload("Product").Order("created_at DESC").Find(&reviews)

	c.JSON(http.StatusOK, reviews)
}

func GetProductReviews(c *gin.Context) {
	productID := c.Param("id")

	var reviews []models.Review
	config.DB.Where("product_id = ? AND is_approved = ?", productID, true).
		Preload("User").
		Order("created_at DESC").
		Find(&reviews)

	c.JSON(http.StatusOK, reviews)
}

func CreateReview(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input struct {
		ProductID uint   `json:"product_id" binding:"required"`
		Rating    int    `json:"rating" binding:"required"`
		Title     string `json:"title"`
		Comment   string `json:"comment"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := utils.ValidateRating(input.Rating); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existing models.Review
	if err := config.DB.Where("user_id = ? AND product_id = ?", userID, input.ProductID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "You have already reviewed this product"})
		return
	}

	review := models.Review{
		UserID:    userID.(uint),
		ProductID: input.ProductID,
		Rating:    input.Rating,
		Title:     input.Title,
		Comment:   input.Comment,
	}

	if err := config.DB.Create(&review).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review"})
		return
	}

	c.JSON(http.StatusCreated, review)
}

func UpdateReview(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	reviewID := c.Param("id")

	var review models.Review
	if err := config.DB.Where("id = ? AND user_id = ?", reviewID, userID).First(&review).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}

	var input struct {
		Rating  int    `json:"rating"`
		Title   string `json:"title"`
		Comment string `json:"comment"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Rating > 0 {
		if err := utils.ValidateRating(input.Rating); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		review.Rating = input.Rating
	}
	if input.Title != "" {
		review.Title = input.Title
	}
	if input.Comment != "" {
		review.Comment = input.Comment
	}

	config.DB.Save(&review)

	c.JSON(http.StatusOK, review)
}

func DeleteReview(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	reviewID := c.Param("id")

	result := config.DB.Where("id = ? AND user_id = ?", reviewID, userID).Delete(&models.Review{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}

func GetAllReviews(c *gin.Context) {
	var reviews []models.Review
	query := config.DB.Preload("Product").Preload("User")

	if approved := c.Query("approved"); approved != "" {
		query = query.Where("is_approved = ?", approved == "true")
	}

	query.Order("created_at DESC").Find(&reviews)

	c.JSON(http.StatusOK, reviews)
}

func ApproveReview(c *gin.Context) {
	reviewID := c.Param("id")

	var review models.Review
	if err := config.DB.First(&review, reviewID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}

	review.IsApproved = true
	config.DB.Save(&review)

	c.JSON(http.StatusOK, gin.H{"message": "Review approved"})
}

func GetNotificationPreferences(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var prefs models.NotificationPreference
	if err := config.DB.Where("user_id = ?", userID).First(&prefs).Error; err != nil {
		prefs = models.NotificationPreference{
			UserID:         userID.(uint),
			OrderCreated:   true,
			OrderShipped:   true,
			OrderDelivered: true,
			OrderStatus:    true,
			EmailEnabled:   true,
			PushEnabled:    true,
		}
		config.DB.Create(&prefs)
	}

	c.JSON(http.StatusOK, prefs)
}

func UpdateNotificationPreferences(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var prefs models.NotificationPreference
	if err := config.DB.Where("user_id = ?", userID).First(&prefs).Error; err != nil {
		prefs.UserID = userID.(uint)
		config.DB.Create(&prefs)
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config.DB.Model(&prefs).Updates(updates)
	config.DB.First(&prefs, prefs.ID)

	c.JSON(http.StatusOK, prefs)
}

func GetCoupons(c *gin.Context) {
	var coupons []models.Coupon
	config.DB.Order("created_at DESC").Find(&coupons)

	c.JSON(http.StatusOK, coupons)
}

func CreateCoupon(c *gin.Context) {
	var input models.Coupon
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := utils.ValidateCouponCode(input.Code); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.Code = os.Getenv("APP_ENV") + input.Code

	var existing models.Coupon
	if err := config.DB.Where("code = ?", input.Code).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Coupon code already exists"})
		return
	}

	if input.DiscountType != "percentage" && input.DiscountType != "fixed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid discount type"})
		return
	}

	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create coupon"})
		return
	}

	c.JSON(http.StatusCreated, input)
}

func UpdateCoupon(c *gin.Context) {
	couponID := c.Param("id")

	var coupon models.Coupon
	if err := config.DB.First(&coupon, couponID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Coupon not found"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	delete(updates, "code")

	config.DB.Model(&coupon).Updates(updates)
	config.DB.First(&coupon, coupon.ID)

	c.JSON(http.StatusOK, coupon)
}

func DeleteCoupon(c *gin.Context) {
	couponID := c.Param("id")

	result := config.DB.Delete(&models.Coupon{}, couponID)
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Coupon not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Coupon deleted"})
}

func ValidateCoupon(c *gin.Context) {
	code := c.Query("code")
	amount := c.Query("amount")

	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Coupon code required"})
		return
	}

	var coupon models.Coupon
	if err := config.DB.Where("code = ?", code).First(&coupon).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"valid": false, "error": "Invalid coupon code"})
		return
	}

	if !coupon.IsValid() {
		c.JSON(http.StatusOK, gin.H{"valid": false, "error": "Coupon has expired or reached usage limit"})
		return
	}

	var orderAmount float64
	if amount != "" {
		fmt.Sscanf(amount, "%f", &orderAmount)
	}

	if orderAmount > 0 && coupon.MinOrderAmount > 0 && orderAmount < coupon.MinOrderAmount {
		c.JSON(http.StatusOK, gin.H{
			"valid":            false,
			"error":            "Order amount does not meet minimum requirement",
			"min_order_amount": coupon.MinOrderAmount,
		})
		return
	}

	discountAmount := coupon.DiscountValue
	if coupon.DiscountType == "percentage" {
		discountAmount = orderAmount * (coupon.DiscountValue / 100)
		if coupon.MaxDiscountAmount > 0 && discountAmount > coupon.MaxDiscountAmount {
			discountAmount = coupon.MaxDiscountAmount
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":           true,
		"discount_type":   coupon.DiscountType,
		"discount_value":  coupon.DiscountValue,
		"discount_amount": discountAmount,
		"code":            coupon.Code,
	})
}

func ShiprocketWebhook(c *gin.Context) {
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	utils.Info("Shiprocket webhook received", payload)

	c.JSON(http.StatusOK, gin.H{"status": "received"})
}

func GetUserOrders(c *gin.Context) {
	userID, exists := c.Get("user_id")
	var uid uint
	if exists {
		uid = userID.(uint)
	} else {
		userIDStr := c.Param("userId")
		id, err := strconv.Atoi(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}
		uid = uint(id)
	}

	var orders []models.Order
	query := config.DB.Where("user_id = ?", uid).Preload("Items.Product")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	query.Order("created_at DESC").Find(&orders)

	c.JSON(http.StatusOK, orders)
}
