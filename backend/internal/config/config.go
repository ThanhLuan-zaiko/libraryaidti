package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
	ServerPort string
	AppEnv     string // dev, prod, staging
}

func LoadConfig() *Config {
	// Try to load from current directory, then parent, then two levels up
	// to account for running from root or cmd/server
	err := godotenv.Load(".env")
	if err != nil {
		err = godotenv.Load("../.env")
	}
	if err != nil {
		err = godotenv.Load("../../.env")
	}

	if err != nil {
		log.Println("No .env file found, using environment variables and fallbacks")
	}

	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "libraryaidti_user"),
		DBPassword: getEnv("DB_PASSWORD", "123456"),
		DBName:     getEnv("DB_NAME", "libraryaidti_db"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),
		ServerPort: getEnv("SERVER_PORT", "8080"),
		AppEnv:     getEnv("APP_ENV", "dev"),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
