package routes

import (
	"pashmina-backend/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		// Products
		api.GET("/products", handlers.GetProducts)
		api.GET("/products/search", handlers.SearchProducts)
		api.GET("/products/:id", handlers.GetProduct)
		api.GET("/filters", handlers.GetFilterOptions)

		// Admin - Product management
		api.POST("/products", handlers.CreateProduct)
		api.PUT("/products/:id", handlers.UpdateProduct)
		api.DELETE("/products/:id", handlers.DeleteProduct)

		// Categories
		api.GET("/categories", handlers.GetCategories)

		// Admin - Category management
		api.POST("/categories", handlers.CreateCategory)
		api.PUT("/categories/:id", handlers.UpdateCategory)
		api.DELETE("/categories/:id", handlers.DeleteCategory)

		// Catalogues (Collections)
		api.GET("/catalogues", handlers.GetCatalogues)
		api.GET("/catalogues/:id", handlers.GetCatalogue)

		// Admin - Catalogue management
		api.POST("/catalogues", handlers.CreateCatalogue)
		api.PUT("/catalogues/:id", handlers.UpdateCatalogue)
		api.DELETE("/catalogues/:id", handlers.DeleteCatalogue)
		api.POST("/catalogues/:id/products", handlers.AddProductsToCatalogue)
		api.DELETE("/catalogues/:id/products", handlers.RemoveProductsFromCatalogue)

		// Page content
		api.GET("/content/:page", handlers.GetPageContent)

		// Admin - Content management
		api.POST("/content", handlers.CreatePageContent)
		api.PUT("/content/:id", handlers.UpdatePageContent)

		// Orders
		api.POST("/orders", handlers.CreateOrder)
		api.GET("/orders/:id", handlers.GetOrderDetails)
		api.GET("/orders/user/:userId", handlers.GetUserOrders)
		api.PATCH("/orders/:id/status", handlers.UpdateOrderStatus)
		api.POST("/orders/:id/cancel", handlers.CancelOrder)
		api.GET("/orders/:id/tracking", handlers.GetOrderTracking)
		api.POST("/orders/:id/ship", handlers.GenerateShippingLabel)

		// Payment
		api.POST("/payments/create-intent", handlers.CreatePaymentIntent)
		api.POST("/payments/verify", handlers.VerifyPayment)
		api.GET("/payments/:paymentId/status", handlers.GetPaymentStatus)
		api.POST("/payments/refund", handlers.ProcessRefund)
		api.POST("/webhooks/razorpay", handlers.RazorpayWebhook)

		// Shipping
		api.GET("/shipping/calculate-rates", handlers.CalculateShippingRates)
		api.POST("/shipping/create-order", handlers.CreateShippingOrder)
		api.GET("/shipping/track/:awb", handlers.TrackShipment)
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}
