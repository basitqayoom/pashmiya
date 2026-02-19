package config

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func LoadEnv() {
	execDir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err != nil {
		execDir = "."
	}

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
			return
		}
	}
	log.Println("No .env file found, using system environment variables")
}

func ConnectDB() {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "postgres")
	dbname := getEnv("DB_NAME", "pashmina")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	logLevel := logger.Info
	if os.Getenv("ENVIRONMENT") == "production" {
		logLevel = logger.Warn
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatalf("Failed to get database connection: %v", err)
	}

	maxOpenConns := 25
	maxIdleConns := 10
	connMaxLifetime := 5 * time.Minute
	connMaxIdleTime := 10 * time.Minute

	if v := os.Getenv("DB_MAX_OPEN_CONNS"); v != "" {
		fmt.Sscanf(v, "%d", &maxOpenConns)
	}
	if v := os.Getenv("DB_MAX_IDLE_CONNS"); v != "" {
		fmt.Sscanf(v, "%d", &maxIdleConns)
	}

	sqlDB.SetMaxOpenConns(maxOpenConns)
	sqlDB.SetMaxIdleConns(maxIdleConns)
	sqlDB.SetConnMaxLifetime(connMaxLifetime)
	sqlDB.SetConnMaxIdleTime(connMaxIdleTime)

	log.Printf("Database connected successfully (pool: max_open=%d, max_idle=%d)", maxOpenConns, maxIdleConns)
}

func CloseDB() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
