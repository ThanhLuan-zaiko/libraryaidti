package main

import (
	"log"
	"net/http"

	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/domain"
	"backend/internal/handler"
	"backend/internal/repository"
	"backend/internal/router"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Load configuration
	cfg := config.LoadConfig()

	// 2. Initialize Database
	db.InitDB(cfg)

	// 3. Auto Migration
	err := db.DB.AutoMigrate(
		&domain.Article{},
		&domain.Category{},
		&domain.User{},
		&domain.Role{},
		&domain.Permission{},
		&domain.UserSession{},
	)
	if err != nil {
		log.Fatalf("AutoMigration failed: %v", err)
	}

	// 4. Setup dependency injection
	articleRepo := repository.NewArticleRepository(db.DB)
	categoryRepo := repository.NewCategoryRepository(db.DB)
	articleService := service.NewArticleService(articleRepo)
	categoryService := service.NewCategoryService(categoryRepo)
	articleHandler := handler.NewArticleHandler(articleService)
	categoryHandler := handler.NewCategoryHandler(categoryService)

	authRepo := repository.NewAuthRepository(db.DB)
	authService := service.NewAuthService(authRepo)
	authHandler := handler.NewAuthHandler(authService)

	statsRepo := repository.NewStatsRepository(db.DB)
	statsService := service.NewStatsService(statsRepo)
	statsHandler := handler.NewStatsHandler(statsService)

	// 5. Setup Router
	r := gin.Default()

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	appRouter := router.NewRouter(articleHandler, categoryHandler, authHandler, statsHandler)
	appRouter.Setup(r)

	// 6. Start Server
	log.Printf("Server starting on port %s", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
