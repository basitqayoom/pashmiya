package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"pashmina-backend/config"
	"pashmina-backend/models"
	"pashmina-backend/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func GetProducts(c *gin.Context) {
	var products []models.Product
	query := config.DB.Preload("Category")

	if category := c.Query("category"); category != "" {
		query = query.Where("category_id = ?", category)
	}

	if featured := c.Query("featured"); featured == "true" {
		query = query.Where("is_featured = ?", true)
	}

	sort := c.DefaultQuery("sort", "id")
	order := c.DefaultQuery("order", "desc")

	sort, err := utils.ValidateSortColumn(sort)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	order, err = utils.ValidateOrderDirection(order)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query = query.Order(sort + " " + order)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	page, limit = utils.ValidatePagination(page, limit)
	offset := (page - 1) * limit

	var total int64
	query.Model(&models.Product{}).Count(&total)

	query.Offset(offset).Limit(limit).Find(&products)

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

func GetProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}
	var product models.Product

	if err := config.DB.Preload("Category").First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	c.JSON(http.StatusOK, product)
}

func GetFilterOptions(c *gin.Context) {
	var products []models.Product
	config.DB.Find(&products)

	colorSet := make(map[string]bool)
	for _, p := range products {
		for _, color := range p.Colors {
			colorSet[color] = true
		}
	}
	colors := []string{}
	for color := range colorSet {
		colors = append(colors, color)
	}

	sizeSet := make(map[string]bool)
	for _, p := range products {
		for _, size := range p.Sizes {
			sizeSet[size] = true
		}
	}
	sizes := []string{}
	for size := range sizeSet {
		sizes = append(sizes, size)
	}

	minPrice := 0.0
	maxPrice := 2000.0
	if len(products) > 0 {
		minPrice = products[0].Price
		maxPrice = products[0].Price
		for _, p := range products {
			if p.Price < minPrice {
				minPrice = p.Price
			}
			if p.Price > maxPrice {
				maxPrice = p.Price
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"colors":    colors,
		"sizes":     sizes,
		"min_price": minPrice,
		"max_price": maxPrice,
	})
}

func SearchProducts(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query required"})
		return
	}

	var products []models.Product
	config.DB.Where("name ILIKE ? OR description ILIKE ?", "%"+query+"%", "%"+query+"%").Preload("Category").Find(&products)
	c.JSON(http.StatusOK, products)
}

func CreateProduct(c *gin.Context) {
	var input struct {
		Name        string   `json:"name" binding:"required"`
		Price       float64  `json:"price" binding:"required"`
		Description string   `json:"description"`
		Image       string   `json:"image"`
		CategoryID  uint     `json:"category_id" binding:"required"`
		Colors      []string `json:"colors"`
		Sizes       []string `json:"sizes"`
		Stock       int      `json:"stock"`
		IsFeatured  bool     `json:"is_featured"`
		IsActive    bool     `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := utils.ValidateProductName(input.Name); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := utils.ValidatePrice(input.Price); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := utils.ValidateStock(input.Stock); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := utils.ValidateURL(input.Image); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var category models.Category
	if err := config.DB.First(&category, input.CategoryID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category not found"})
		return
	}

	product := models.Product{
		Name:        utils.SanitizeString(input.Name, 255),
		Price:       input.Price,
		Description: utils.SanitizeString(input.Description, 2000),
		Image:       input.Image,
		CategoryID:  input.CategoryID,
		Colors:      input.Colors,
		Sizes:       input.Sizes,
		Stock:       input.Stock,
		IsFeatured:  input.IsFeatured,
		IsActive:    input.IsActive,
	}

	if err := config.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	utils.Info("Product created", map[string]interface{}{"product_id": product.ID, "name": product.Name})

	c.JSON(http.StatusCreated, product)
}

func UpdateProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}
	var product models.Product

	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config.DB.Model(&product).Updates(updates)
	config.DB.Preload("Category").First(&product, id)
	c.JSON(http.StatusOK, product)
}

func DeleteProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}
	var product models.Product

	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	config.DB.Delete(&product)
	c.JSON(http.StatusOK, gin.H{"message": "Product deleted"})
}

// Categories
func GetCategories(c *gin.Context) {
	var categories []models.Category
	config.DB.Find(&categories)
	c.JSON(http.StatusOK, categories)
}

func CreateCategory(c *gin.Context) {
	var category models.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	config.DB.Create(&category)
	c.JSON(http.StatusCreated, category)
}

func UpdateCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}
	var category models.Category

	if err := config.DB.First(&category, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if result := config.DB.Model(&category).Updates(updates); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category"})
		return
	}

	// Reload the category to return the latest data
	config.DB.First(&category, id)
	c.JSON(http.StatusOK, category)
}

func DeleteCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}
	var category models.Category

	if err := config.DB.First(&category, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	fmt.Printf(">>> DeleteCategory: Found category ID=%d, Name=%s\n", category.ID, category.Name)

	// Unlink products from this category before deleting
	config.DB.Model(&models.Product{}).Where("category_id = ?", id).Update("category_id", 0)

	result := config.DB.Delete(&category)
	fmt.Printf(">>> DeleteCategory: Rows affected=%d, Error=%v\n", result.RowsAffected, result.Error)
	if result.Error != nil {
		fmt.Printf("Error deleting category ID=%d: %v\n", category.ID, result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category deleted"})
}

// Catalogues
func GetCatalogues(c *gin.Context) {
	var catalogues []models.Catalogue
	query := config.DB.Preload("Products.Category")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status == "true")
	}

	if search := c.Query("search"); search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}

	query.Order("sort_order ASC, created_at DESC").Find(&catalogues)
	c.JSON(http.StatusOK, catalogues)
}

func GetCatalogue(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid catalogue ID"})
		return
	}
	var catalogue models.Catalogue

	if err := config.DB.Preload("Products.Category").First(&catalogue, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Catalogue not found"})
		return
	}
	c.JSON(http.StatusOK, catalogue)
}

func CreateCatalogue(c *gin.Context) {
	var input models.CreateCatalogueInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	catalogue := models.Catalogue{
		Name:        input.Name,
		Description: input.Description,
		Image:       input.Image,
		Status:      input.Status,
		SortOrder:   input.SortOrder,
	}

	config.DB.Create(&catalogue)

	var products []models.Product
	for _, p := range input.Products {
		if p.ID > 0 {
			var existingProduct models.Product
			if err := config.DB.First(&existingProduct, p.ID).Error; err == nil {
				products = append(products, existingProduct)
			}
		}
	}

	if len(products) > 0 {
		config.DB.Model(&catalogue).Association("Products").Append(products)
		config.DB.Preload("Products.Category").First(&catalogue)
	}

	c.JSON(http.StatusCreated, catalogue)
}

func UpdateCatalogue(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid catalogue ID"})
		return
	}
	var catalogue models.Catalogue

	if err := config.DB.First(&catalogue, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Catalogue not found"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config.DB.Model(&catalogue).Updates(updates)
	config.DB.Preload("Products.Category").First(&catalogue)
	c.JSON(http.StatusOK, catalogue)
}

func DeleteCatalogue(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid catalogue ID"})
		return
	}
	var catalogue models.Catalogue

	if err := config.DB.First(&catalogue, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Catalogue not found"})
		return
	}

	config.DB.Model(&catalogue).Association("Products").Clear()
	config.DB.Delete(&catalogue)
	c.JSON(http.StatusOK, gin.H{"message": "Catalogue deleted"})
}

func AddProductsToCatalogue(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid catalogue ID"})
		return
	}
	var catalogue models.Catalogue

	if err := config.DB.First(&catalogue, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Catalogue not found"})
		return
	}

	var input struct {
		ProductIDs []uint `json:"product_ids"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var products []models.Product
	for _, pid := range input.ProductIDs {
		var product models.Product
		if err := config.DB.First(&product, pid).Error; err == nil {
			products = append(products, product)
		}
	}

	if len(products) > 0 {
		config.DB.Model(&catalogue).Association("Products").Append(products)
	}

	config.DB.Preload("Products.Category").First(&catalogue)
	c.JSON(http.StatusOK, catalogue)
}

func RemoveProductsFromCatalogue(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid catalogue ID"})
		return
	}
	var catalogue models.Catalogue

	if err := config.DB.First(&catalogue, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Catalogue not found"})
		return
	}

	var input struct {
		ProductIDs []uint `json:"product_ids"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var products []models.Product
	for _, pid := range input.ProductIDs {
		var product models.Product
		if err := config.DB.First(&product, pid).Error; err == nil {
			products = append(products, product)
		}
	}

	if len(products) > 0 {
		config.DB.Model(&catalogue).Association("Products").Delete(products)
	}

	config.DB.Preload("Products.Category").First(&catalogue)
	c.JSON(http.StatusOK, catalogue)
}

// Page Content
func GetPageContent(c *gin.Context) {
	page := c.Param("page")
	var contents []models.PageContent
	config.DB.Where("page = ?", page).Find(&contents)
	c.JSON(http.StatusOK, contents)
}

func CreatePageContent(c *gin.Context) {
	var content models.PageContent
	if err := c.ShouldBindJSON(&content); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	config.DB.Create(&content)
	c.JSON(http.StatusCreated, content)
}

func UpdatePageContent(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid content ID"})
		return
	}
	var content models.PageContent

	if err := config.DB.First(&content, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Content not found"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config.DB.Model(&content).Updates(updates)
	c.JSON(http.StatusOK, content)
}

// Orders
func CreateOrder(c *gin.Context) {
	var input struct {
		UserID          uint             `json:"user_id"`
		Items           []OrderItemInput `json:"items" binding:"required,min=1"`
		TotalAmount     float64          `json:"total_amount" binding:"required"`
		DiscountAmount  float64          `json:"discount_amount"`
		ShippingCost    float64          `json:"shipping_cost"`
		TaxAmount       float64          `json:"tax_amount"`
		ShippingName    string           `json:"shipping_name" binding:"required"`
		ShippingAddress string           `json:"shipping_address" binding:"required"`
		ShippingCity    string           `json:"shipping_city" binding:"required"`
		ShippingState   string           `json:"shipping_state" binding:"required"`
		ShippingCountry string           `json:"shipping_country" binding:"required"`
		ShippingZip     string           `json:"shipping_zip" binding:"required"`
		ShippingPhone   string           `json:"shipping_phone" binding:"required"`
		ShippingEmail   string           `json:"shipping_email"`
		CouponCode      string           `json:"coupon_code"`
		Notes           string           `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := utils.ValidateAddress(input.ShippingAddress, input.ShippingCity, input.ShippingState, input.ShippingCountry); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := utils.ValidatePostalCode(input.ShippingZip); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := config.DB.Begin()

	for _, item := range input.Items {
		var product models.Product
		if err := tx.First(&product, item.ProductID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Product %d not found", item.ProductID)})
			return
		}

		if product.Stock < item.Quantity {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{
				"error":      "Insufficient stock",
				"product_id": item.ProductID,
				"product":    product.Name,
				"available":  product.Stock,
				"requested":  item.Quantity,
			})
			return
		}

		if err := tx.Model(&product).Update("stock", product.Stock-item.Quantity).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update stock"})
			return
		}
	}

	order := models.Order{
		UserID:          input.UserID,
		Status:          "pending_payment",
		TotalAmount:     input.TotalAmount,
		DiscountAmount:  input.DiscountAmount,
		ShippingCost:    input.ShippingCost,
		TaxAmount:       input.TaxAmount,
		ShippingName:    input.ShippingName,
		ShippingAddress: input.ShippingAddress,
		ShippingCity:    input.ShippingCity,
		ShippingState:   input.ShippingState,
		ShippingCountry: input.ShippingCountry,
		ShippingZip:     input.ShippingZip,
		ShippingPhone:   input.ShippingPhone,
		ShippingEmail:   input.ShippingEmail,
		CouponCode:      input.CouponCode,
		Notes:           input.Notes,
	}

	if err := tx.Create(&order).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	for _, itemInput := range input.Items {
		orderItem := models.OrderItem{
			OrderID:   order.ID,
			ProductID: itemInput.ProductID,
			Quantity:  itemInput.Quantity,
			Price:     itemInput.Price,
			Color:     itemInput.Color,
			Size:      itemInput.Size,
		}
		if err := tx.Create(&orderItem).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order items"})
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete order"})
		return
	}

	utils.Info("Order created", map[string]interface{}{
		"order_id": order.ID,
		"user_id":  input.UserID,
		"total":    input.TotalAmount,
	})

	c.JSON(http.StatusCreated, gin.H{
		"order_id": order.ID,
		"status":   order.Status,
		"message":  "Order created successfully",
	})
}

type OrderItemInput struct {
	ProductID uint    `json:"product_id" binding:"required"`
	Quantity  int     `json:"quantity" binding:"required,min=1"`
	Price     float64 `json:"price" binding:"required"`
	Color     string  `json:"color"`
	Size      string  `json:"size"`
}

// Auth
func Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":  user,
		"token": "jwt-token-placeholder",
	})
}

func GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":    user.ID,
		"name":  user.Name,
		"email": user.Email,
		"role":  user.Role,
	})
}
