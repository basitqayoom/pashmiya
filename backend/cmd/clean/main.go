package main

import (
	"log"
	"pashmina-backend/config"
)

func init() {
	// This is a separate command to clean the database
}

func main() {
	config.LoadEnv()
	config.ConnectDB()

	log.Println("Cleaning database...")

	// Disable foreign key checks temporarily
	config.DB.Exec("SET session_replication_role = 'replica';")

	// Truncate tables in correct order (child tables first)
	tables := []string{
		"order_items",
		"orders",
		"users",
		"newsletters",
		"page_contents",
		"notifications",
		"notification_preferences",
		"admin_notification_settings",
		"notification_templates",
	}

	for _, table := range tables {
		result := config.DB.Exec("TRUNCATE TABLE " + table + " CASCADE")
		if result.Error != nil {
			log.Printf("Error truncating %s: %v", table, result.Error)
		} else {
			log.Printf("✓ Truncated %s", table)
		}
	}

	// Re-enable foreign key checks
	config.DB.Exec("SET session_replication_role = 'origin';")

	log.Println("✅ Database cleaned successfully!")
	log.Println("Kept: products, categories, catalogues")
}
