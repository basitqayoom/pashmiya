package routes

import (
	"pashmina-backend/handlers"
	"pashmina-backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	r.Use(middleware.RequestID())
	r.Use(middleware.Recovery())

	api := r.Group("/api")
	api.Use(middleware.APIRateLimit())
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok", "service": "pashmina-backend"})
		})

		api.GET("/products", handlers.GetProducts)
		api.GET("/products/search", handlers.SearchProducts)
		api.GET("/products/:id", handlers.GetProduct)
		api.GET("/filters", handlers.GetFilterOptions)

		api.GET("/categories", handlers.GetCategories)

		api.GET("/catalogues", handlers.GetCatalogues)
		api.GET("/catalogues/:id", handlers.GetCatalogue)

		api.GET("/content/:page", handlers.GetPageContent)

		api.POST("/newsletter/subscribe", handlers.SubscribeNewsletter)

		api.GET("/shipping/calculate-rates", handlers.CalculateShippingRates)
		api.GET("/shipping/track/:awb", handlers.TrackShipment)

		auth := api.Group("/auth")
		auth.Use(middleware.AuthRateLimit())
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.POST("/logout", handlers.Logout)
			auth.POST("/refresh", handlers.RefreshToken)
		}

		protected := api.Group("")
		protected.Use(middleware.Auth())
		{
			protected.GET("/user/me", handlers.GetCurrentUser)
			protected.PUT("/user/me", handlers.UpdateCurrentUser)

			protected.GET("/addresses", handlers.GetAddresses)
			protected.POST("/addresses", handlers.CreateAddress)
			protected.PUT("/addresses/:id", handlers.UpdateAddress)
			protected.DELETE("/addresses/:id", handlers.DeleteAddress)

			protected.GET("/orders", handlers.GetUserOrders)
			protected.POST("/orders", handlers.CreateOrder)
			protected.GET("/orders/:id", handlers.GetOrderDetails)
			protected.POST("/orders/:id/cancel", handlers.CancelOrder)
			protected.GET("/orders/:id/tracking", handlers.GetOrderTracking)

			protected.GET("/wishlist", handlers.GetWishlist)
			protected.POST("/wishlist", handlers.AddToWishlist)
			protected.DELETE("/wishlist/:productId", handlers.RemoveFromWishlist)

			protected.GET("/reviews", handlers.GetUserReviews)
			protected.POST("/reviews", handlers.CreateReview)
			protected.PUT("/reviews/:id", handlers.UpdateReview)
			protected.DELETE("/reviews/:id", handlers.DeleteReview)

			protected.GET("/notifications/preferences", handlers.GetNotificationPreferences)
			protected.PUT("/notifications/preferences", handlers.UpdateNotificationPreferences)

			protected.POST("/payments/create-intent", handlers.CreatePaymentIntent)
			protected.POST("/payments/verify", handlers.VerifyPayment)
			protected.GET("/payments/:paymentId/status", handlers.GetPaymentStatus)
		}

		admin := api.Group("/admin")
		admin.Use(middleware.AdminAuth())
		{
			admin.POST("/products", handlers.CreateProduct)
			admin.PUT("/products/:id", handlers.UpdateProduct)
			admin.DELETE("/products/:id", handlers.DeleteProduct)

			admin.POST("/categories", handlers.CreateCategory)
			admin.PUT("/categories/:id", handlers.UpdateCategory)
			admin.DELETE("/categories/:id", handlers.DeleteCategory)

			admin.POST("/catalogues", handlers.CreateCatalogue)
			admin.PUT("/catalogues/:id", handlers.UpdateCatalogue)
			admin.DELETE("/catalogues/:id", handlers.DeleteCatalogue)
			admin.POST("/catalogues/:id/products", handlers.AddProductsToCatalogue)
			admin.DELETE("/catalogues/:id/products", handlers.RemoveProductsFromCatalogue)

			admin.POST("/content", handlers.CreatePageContent)
			admin.PUT("/content/:id", handlers.UpdatePageContent)

			admin.GET("/orders", handlers.GetAllOrders)
			admin.PATCH("/orders/:id/status", handlers.UpdateOrderStatus)
			admin.POST("/orders/:id/ship", handlers.GenerateShippingLabel)

			admin.POST("/payments/refund", handlers.ProcessRefund)

			admin.POST("/coupons", handlers.CreateCoupon)
			admin.GET("/coupons", handlers.GetCoupons)
			admin.PUT("/coupons/:id", handlers.UpdateCoupon)
			admin.DELETE("/coupons/:id", handlers.DeleteCoupon)

			admin.GET("/reviews", handlers.GetAllReviews)
			admin.PATCH("/reviews/:id/approve", handlers.ApproveReview)
		}

		api.GET("/coupons/validate", handlers.ValidateCoupon)

		api.GET("/products/:id/reviews", handlers.GetProductReviews)
	}

	api.POST("/webhooks/razorpay", handlers.RazorpayWebhook)
	api.POST("/webhooks/shiprocket", handlers.ShiprocketWebhook)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "pashmina-backend"})
	})
}
