package main

import (
	"log"
	"net/http"

	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/domain"
	"backend/internal/handler"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Load configuration
	cfg := config.LoadConfig()

	// 2. Initialize Database
	db.InitDB(cfg)

	// 3. Auto Migration (Optional but helpful for first run)
	err := db.DB.AutoMigrate(&domain.Book{})
	if err != nil {
		log.Fatalf("AutoMigration failed: %v", err)
	}

	// 4. Setup dependency injection
	bookRepo := repository.NewBookRepository(db.DB)
	bookService := service.NewBookService(bookRepo)
	bookHandler := handler.NewBookHandler(bookService)

	// 5. Setup Router
	r := gin.Default()

	// Health check and DB connection check
	r.GET("/health", func(c *gin.Context) {
		sqlDB, err := db.DB.DB()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Database disconnected"})
			return
		}

		if err := sqlDB.Ping(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Database unreachable"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "Backend is running and connected to PostgreSQL",
		})
	})

	// Book routes
	v1 := r.Group("/api/v1")
	{
		v1.POST("/books", bookHandler.CreateBook)
		v1.GET("/books", bookHandler.GetBooks)
		v1.GET("/books/:id", bookHandler.GetBook)
	}

	// 6. Start Server
	log.Printf("Server starting on port %s", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
