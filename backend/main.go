package main

import (
	"log"
	"os"

	"pashmina-backend/config"
	"pashmina-backend/middleware"
	"pashmina-backend/models"
	"pashmina-backend/routes"
	"pashmina-backend/websocket"

	"github.com/gin-gonic/gin"
)

func main() {
	config.LoadEnv()
	config.ConnectDB()

	config.DB.AutoMigrate(
		&models.User{},
		&models.Product{},
		&models.Category{},
		&models.Order{},
		&models.OrderItem{},
		&models.Newsletter{},
		&models.PageContent{},
		&models.Notification{},
		&models.NotificationPreference{},
		&models.AdminNotificationSetting{},
		&models.NotificationTemplate{},
		&models.Catalogue{},
	)

	seedData()

	go websocket.GlobalHub.Run()

	r := gin.Default()
	r.Use(middleware.CORS())

	r.GET("/ws", websocket.HandleWebSocket)

	routes.SetupRoutes(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r.Static("/uploads", "./uploads")

	log.Printf("Server running on port %s", port)
	r.Run(":" + port)
}

func seedData() {
	var count int64
	config.DB.Model(&models.Product{}).Count(&count)
	if count == 0 {
		// Create Categories
		categories := []models.Category{
			{Name: "Classic", Slug: "classic", Description: "Timeless Pashmina classics with elegant simplicity", IsActive: true},
			{Name: "Embroidered", Slug: "embroidered", Description: "Hand-embroidered masterpieces with intricate designs", IsActive: true},
			{Name: "Artisan", Slug: "artisan", Description: "Hand-painted unique pieces of wearable art", IsActive: true},
			{Name: "Contemporary", Slug: "contemporary", Description: "Modern designs for the discerning buyer", IsActive: true},
			{Name: "Heritage", Slug: "heritage", Description: "Traditional Jamawar with centuries-old patterns", IsActive: true},
		}
		for _, cat := range categories {
			config.DB.Create(&cat)
		}

		// Create Products
		products := []models.Product{
			{
				Name:        "Classic Pashmina Shawl",
				Price:       450,
				Description: "Timeless elegance in pure Cashmere. This hand-woven Pashmina shawl features the finest quality fibers from the highlands of Kashmir, offering unparalleled softness and warmth. A versatile accessory that elevates any ensemble.",
				Image:       "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&q=80",
				CategoryID:  1,
				Colors:      []string{"Camel", "Grey", "Black", "Ivory"},
				Sizes:       []string{"Standard (70x200cm)", "Large (100x200cm)"},
				Stock:       15,
				IsFeatured:  true,
			},
			{
				Name:        "Embroidered Floral Shawl",
				Price:       680,
				Description: "A masterpiece of Kashmiri craftsmanship featuring intricate floral embroidery done entirely by hand. Each motif tells a story of centuries-old traditions passed down through generations of master artisans.",
				Image:       "https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=800&q=80",
				CategoryID:  2,
				Colors:      []string{"Burgundy", "Navy", "Forest Green", "Black"},
				Sizes:       []string{"Standard (70x200cm)", "Large (100x200cm)"},
				Stock:       8,
				IsFeatured:  true,
			},
			{
				Name:        "Solid Cashmere Wrap",
				Price:       380,
				Description: "Minimalist luxury in its purest form. This sumptuously soft cashmere wrap is perfect for the discerning minimalist who appreciates understated elegance and exceptional quality.",
				Image:       "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&q=80",
				CategoryID:  1,
				Colors:      []string{"Ivory", "Charcoal", "Camel", "Grey"},
				Sizes:       []string{"Standard (70x180cm)", "Large (100x200cm)"},
				Stock:       20,
				IsFeatured:  true,
			},
			{
				Name:        "Hand-Painted Landscape Shawl",
				Price:       890,
				Description: "A wearable work of art. Each shawl features breathtaking hand-painted landscapes inspired by the serene beauty of Kashmir's valleys and mountains. A unique piece that showcases extraordinary artistic talent.",
				Image:       "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
				CategoryID:  3,
				Colors:      []string{"Blue", "Green", "Multicolor", "Sunset"},
				Sizes:       []string{"Standard (70x200cm)", "Large (100x200cm)"},
				Stock:       5,
				IsFeatured:  true,
			},
			{
				Name:        "Striped Silk-Pashmina",
				Price:       520,
				Description: "The perfect blend of silk luster and Pashmina softness. This elegantly striped shawl combines traditional weaving techniques with contemporary design, creating a sophisticated accessory for modern women.",
				Image:       "https://images.unsplash.com/photo-1606293926075-69a00febf280?w=800&q=80",
				CategoryID:  4,
				Colors:      []string{"Rose", "Silver", "Gold", "Champagne"},
				Sizes:       []string{"Standard (70x200cm)", "Large (100x200cm)"},
				Stock:       12,
				IsFeatured:  true,
			},
			{
				Name:        "Jamawar Traditional Shawl",
				Price:       750,
				Description: "The crown jewel of Kashmiri textiles. Jamawar features intricate patterns woven directly into the fabric, requiring exceptional skill and months of meticulous work. A heritage piece that becomes a family treasure.",
				Image:       "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
				CategoryID:  5,
				Colors:      []string{"Royal Blue", "Maroon", "Black", "Forest Green"},
				Sizes:       []string{"Standard (70x200cm)", "Large (100x200cm)"},
				Stock:       6,
				IsFeatured:  true,
			},
			{
				Name:        "Kani Checkered Shawl",
				Price:       620,
				Description: "Traditional Kani weaving technique creates a beautiful checkered pattern. Each small square is woven with precision, resulting in a timeless design that never goes out of style.",
				Image:       "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&q=80",
				CategoryID:  5,
				Colors:      []string{"Grey", "Navy", "Wine", "Mustard"},
				Sizes:       []string{"Standard (70x200cm)", "Large (100x200cm)"},
				Stock:       9,
				IsFeatured:  false,
			},
			{
				Name:        "Amli Embroidered Shawl",
				Price:       580,
				Description: "Featuring the traditional Amli embroidery technique with vine and foliage motifs. Each shawl takes weeks to complete, with artisans working on traditional wooden frames.",
				Image:       "https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=800&q=80",
				CategoryID:  2,
				Colors:      []string{"Cream", "Pink", "Peach", "White"},
				Sizes:       []string{"Standard (70x200cm)", "Large (100x200cm)"},
				Stock:       7,
				IsFeatured:  false,
			},
		}
		for _, product := range products {
			config.DB.Create(&product)
		}

		log.Println("Seed data created successfully!")
	}

	// Seed catalogues separately if none exist
	seedCatalogues()
}

func seedCatalogues() {
	var catalogueCount int64
	config.DB.Model(&models.Catalogue{}).Count(&catalogueCount)

	if catalogueCount == 0 {
		// Create Catalogues (Collections)
		catalogues := []models.Catalogue{
			{
				Name:        "Winter Essentials",
				Description: "Cozy and warm Pashmina shawls perfect for the winter season",
				Image:       "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&q=80",
				Status:      true,
				SortOrder:   1,
			},
			{
				Name:        "Bridal Collection",
				Description: "Exquisite Pashmina shawls for your special day",
				Image:       "https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=800&q=80",
				Status:      true,
				SortOrder:   2,
			},
			{
				Name:        "Heritage Classics",
				Description: "Traditional designs that have stood the test of time",
				Image:       "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
				Status:      true,
				SortOrder:   3,
			},
			{
				Name:        "Modern Minimalist",
				Description: "Contemporary designs for the modern aesthetic",
				Image:       "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&q=80",
				Status:      true,
				SortOrder:   4,
			},
		}

		for i := range catalogues {
			config.DB.Create(&catalogues[i])
		}

		// Associate products with catalogues
		var productList []models.Product
		config.DB.Find(&productList)

		if len(productList) >= 8 {
			// Winter Essentials - Classic and warm items
			config.DB.Model(&catalogues[0]).Association("Products").Append(
				productList[0], // Classic Pashmina Shawl
				productList[2], // Solid Cashmere Wrap
				productList[6], // Kani Checkered Shawl
			)

			// Bridal Collection - Embroidered and elegant
			config.DB.Model(&catalogues[1]).Association("Products").Append(
				productList[1], // Embroidered Floral Shawl
				productList[7], // Amli Embroidered Shawl
				productList[4], // Striped Silk-Pashmina
			)

			// Heritage Classics - Traditional and Jamawar
			config.DB.Model(&catalogues[2]).Association("Products").Append(
				productList[5], // Jamawar Traditional Shawl
				productList[6], // Kani Checkered Shawl
				productList[1], // Embroidered Floral Shawl
			)

			// Modern Minimalist - Contemporary designs
			config.DB.Model(&catalogues[3]).Association("Products").Append(
				productList[2], // Solid Cashmere Wrap
				productList[4], // Striped Silk-Pashmina
				productList[0], // Classic Pashmina Shawl
			)
		}

		log.Println("Catalogue seed data created successfully!")
	}
}
