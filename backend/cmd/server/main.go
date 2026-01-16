package main

import (
	"log/slog"
	"net/http"

	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/domain"
	"backend/internal/handler"
	"backend/internal/logger"
	"backend/internal/middleware"
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

	// 2. Initialize Logger
	logger.Init(logger.Options{
		Level:        slog.LevelInfo,
		IsProduction: cfg.AppEnv == "prod",
	})
	log := logger.Get() // Shadowing the standard log package for this scope if needed, or just use logger.Get()

	log.Info("Starting application", "env", cfg.AppEnv, "port", cfg.ServerPort)

	// 3. Initialize Database
	db.InitDB(cfg)

	// Initialize Session
	session.InitSession(db.DB)

	// Initialize WebSocket Hub
	wsHub := ws.NewHub()
	go wsHub.Run()

	// Initialize Response Cache
	respCache := middleware.NewResponseCache()

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
		&domain.ArticleRating{},
		&domain.ArticleView{}, // View tracking
	)
	if err != nil {
		logger.Get().Error("AutoMigration failed", "error", err)
		return // Exit main
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
	articleHandler := handler.NewArticleHandler(articleService, respCache, wsHub)
	categoryHandler := handler.NewCategoryHandler(categoryService, respCache, wsHub)

	tagRepo := repository.NewTagRepository(db.DB)
	tagService := service.NewTagService(tagRepo)
	tagHandler := handler.NewTagHandler(tagService, respCache, wsHub)

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
	userHandler := handler.NewUserHandler(userService, respCache, wsHub)

	seoHandler := handler.NewSeoHandler(seoService)

	// Comments
	commentRepo := repository.NewCommentRepository(db.DB)
	commentService := service.NewCommentService(commentRepo, articleRepo)
	commentHandler := handler.NewCommentHandler(commentService, wsHub)

	// Ratings
	ratingRepo := repository.NewRatingRepository(db.DB)
	ratingService := service.NewRatingService(ratingRepo, articleRepo)
	ratingHandler := handler.NewRatingHandler(ratingService)

	// View Tracking
	viewTrackingRepo := repository.NewViewTrackingRepository(db.DB)
	viewTrackingService := service.NewViewTrackingService(viewTrackingRepo, articleRepo)
	viewTrackingHandler := handler.NewViewTrackingHandler(viewTrackingService)

	appRouter := router.NewRouter(articleHandler, categoryHandler, tagHandler, authHandler, statsHandler, dashboardHandler, userHandler, uploadHandler, seoHandler, commentHandler, ratingHandler, viewTrackingHandler, wsHub, respCache)
	appRouter.Setup(r)

	// 6. Start Server
	logger.Get().Info("Server starting", "port", cfg.ServerPort)
	handler := session.SessionManager.LoadAndSave(r)
	if err := http.ListenAndServe(":"+cfg.ServerPort, handler); err != nil {
		logger.Get().Error("Failed to start server", "error", err)
	}
}
