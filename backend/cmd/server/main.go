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
	"backend/internal/session"
	"backend/internal/ws"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Load configuration
	cfg := config.LoadConfig()

	// 2. Initialize Database
	db.InitDB(cfg)

	// Initialize Session
	session.InitSession(db.DB)

	// Initialize WebSocket Hub
	wsHub := ws.NewHub()
	go wsHub.Run()

	// 3. Auto Migration
	err := db.DB.AutoMigrate(
		&domain.Article{},
		&domain.Category{},
		&domain.Tag{},
		&domain.User{},
		&domain.Role{},
		&domain.Permission{},
		&domain.MediaFile{},
		&domain.MediaFileVersion{},
		&domain.ArticleMedia{},
		&domain.ArticleMediaVersion{},
		&domain.ArticleImage{},
		&domain.ArticleVersion{},
		&domain.ArticleStatusLog{},
		&domain.SeoMetadata{},
		&domain.SeoRedirect{},
		&domain.ArticleSeoRedirect{},
	)
	if err != nil {
		log.Fatalf("AutoMigration failed: %v", err)
	}

	// 4. Setup dependency injection
	auditRepo := repository.NewAuditRepository(db.DB)

	seoRepo := repository.NewSeoRepository(db.DB)
	seoService := service.NewSeoService(seoRepo)

	mediaRepo := repository.NewMediaRepository(db.DB)

	articleRepo := repository.NewArticleRepository(db.DB)
	categoryRepo := repository.NewCategoryRepository(db.DB)
	articleService := service.NewArticleService(articleRepo, mediaRepo, auditRepo, seoService, wsHub)
	categoryService := service.NewCategoryService(categoryRepo)
	articleHandler := handler.NewArticleHandler(articleService)
	categoryHandler := handler.NewCategoryHandler(categoryService)

	tagRepo := repository.NewTagRepository(db.DB)
	tagService := service.NewTagService(tagRepo)
	tagHandler := handler.NewTagHandler(tagService)

	authRepo := repository.NewAuthRepository(db.DB)
	authService := service.NewAuthService(authRepo, auditRepo)
	authHandler := handler.NewAuthHandler(authService)

	statsRepo := repository.NewStatsRepository(db.DB)
	statsService := service.NewStatsService(statsRepo)
	statsHandler := handler.NewStatsHandler(statsService)

	uploadHandler := handler.NewUploadHandler()

	// 5. Setup Router
	r := gin.Default()

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	dashboardRepo := repository.NewDashboardRepository(db.DB)
	dashboardService := service.NewDashboardService(dashboardRepo)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)

	userRepo := repository.NewUserRepository(db.DB)
	userService := service.NewUserService(userRepo, wsHub)
	userHandler := handler.NewUserHandler(userService)

	appRouter := router.NewRouter(articleHandler, categoryHandler, tagHandler, authHandler, statsHandler, dashboardHandler, userHandler, uploadHandler, wsHub)
	appRouter.Setup(r)

	// 6. Start Server
	log.Printf("Server starting on port %s", cfg.ServerPort)
	handler := session.SessionManager.LoadAndSave(r)
	if err := http.ListenAndServe(":"+cfg.ServerPort, handler); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
