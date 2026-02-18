package config

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func LoadEnv() {
	// Get the directory where the executable is running
	execDir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err != nil {
		execDir = "."
	}

	// Try to load .env file from multiple locations
	envPaths := []string{
		filepath.Join(execDir, ".env"),
		filepath.Join(execDir, "..", ".env"),
		filepath.Join(execDir, "..", "..", ".env"),
		".env",
		"backend/.env",
		"../backend/.env",
	}

	for _, path := range envPaths {
		if err := godotenv.Overload(path); err == nil {
			log.Printf("Loaded .env from %s", path)
			// Debug: print some values
			log.Printf("DEBUG: SHIPROCKET_EMAIL = %s", os.Getenv("SHIPROCKET_EMAIL"))
			return
		}
	}
	log.Println("No .env file found, using system environment variables")
}

func ConnectDB() {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "basitqayoomchowdhary")
	password := getEnv("DB_PASSWORD", "postgres")
	dbname := getEnv("DB_NAME", "pashmina")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connected successfully")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
