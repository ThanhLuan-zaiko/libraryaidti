package router

import (
	"backend/internal/domain"
	"backend/internal/handler"
	"backend/internal/middleware"
	"backend/internal/ws"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type Router struct {
	articleHandler      *handler.ArticleHandler
	categoryHandler     *handler.CategoryHandler
	tagHandler          *handler.TagHandler
	authHandler         *handler.AuthHandler
	statsHandler        *handler.StatsHandler
	dashboardHandler    *handler.DashboardHandler
	parentHandler       *handler.UserHandler
	userHandler         *handler.UserHandler
	uploadHandler       *handler.UploadHandler
	seoHandler          *handler.SeoHandler
	commentHandler      *handler.CommentHandler
	ratingHandler       *handler.RatingHandler
	viewTrackingHandler *handler.ViewTrackingHandler
	settingHandler      *handler.SettingHandler
	auditHandler        *handler.AuditHandler
	userRepo            domain.UserRepository
	wsHub               *ws.Hub
	cache               *middleware.ResponseCache
}

func NewRouter(
	articleHandler *handler.ArticleHandler,
	categoryHandler *handler.CategoryHandler,
	tagHandler *handler.TagHandler,
	authHandler *handler.AuthHandler,
	statsHandler *handler.StatsHandler,
	dashboardHandler *handler.DashboardHandler,
	userHandler *handler.UserHandler,
	uploadHandler *handler.UploadHandler,
	seoHandler *handler.SeoHandler,
	commentHandler *handler.CommentHandler, // Added
	ratingHandler *handler.RatingHandler, // Added
	viewTrackingHandler *handler.ViewTrackingHandler, // Added
	settingHandler *handler.SettingHandler, // Added
	auditHandler *handler.AuditHandler, // Added
	wsHub *ws.Hub,
	cache *middleware.ResponseCache,
) *Router {
	return &Router{
		articleHandler:      articleHandler,
		categoryHandler:     categoryHandler,
		tagHandler:          tagHandler,
		authHandler:         authHandler,
		statsHandler:        statsHandler,
		dashboardHandler:    dashboardHandler,
		userHandler:         userHandler,
		uploadHandler:       uploadHandler,
		seoHandler:          seoHandler,
		commentHandler:      commentHandler,
		ratingHandler:       ratingHandler,
		viewTrackingHandler: viewTrackingHandler,
		settingHandler:      settingHandler,
		auditHandler:        auditHandler,
		userRepo:            userHandler.GetService().GetRepo(),
		wsHub:               wsHub,
		cache:               cache,
	}
}

func (r *Router) Setup(engine *gin.Engine) {
	// 0. Logger Middleware (First to capture everything)
	engine.Use(middleware.LoggerMiddleware())
	// 0.1 Error Handler Middleware
	engine.Use(middleware.ErrorHandlerMiddleware())

	// CORS Middleware
	allowedOrigins := map[string]bool{
		"http://localhost:3000":    true,
		"http://127.0.0.1:3000":    true,
		"http://192.168.1.10:3000": true,
	}

	engine.Use(func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if allowedOrigins[origin] {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}

		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Serve uploaded files
	// When running from backend/cmd/server/, project root is ../../
	engine.Static("/uploads", "../../uploads")

	// WebSocket route - bypass global rate limiting to avoid connection drops during navigation
	engine.GET("/api/v1/ws", func(c *gin.Context) {
		ws.ServeWs(r.wsHub, c)
	})

	v1 := engine.Group("/api/v1")
	// 1. Protection from massive payloads (50MB limit for regular API calls)
	v1.Use(middleware.RequestSizeMiddleware(50 * 1024 * 1024))
	// 2. Global rate limiting - 30 req/sec, burst 60
	v1.Use(middleware.RateLimitMiddleware(rate.Limit(30.0), 60))
	// 3. Request Timeout
	v1.Use(middleware.TimeoutMiddleware(time.Second * 30))
	{
		// Auth routes
		auth := v1.Group("/auth")
		{
			auth.POST("/register", r.authHandler.Register)
			auth.POST("/login", middleware.RateLimitMiddleware(rate.Limit(5.0/60.0), 10), r.authHandler.Login)
			auth.POST("/logout", r.authHandler.Logout)
		}

		// Upload route
		v1.POST("/upload", r.uploadHandler.UploadImage)

		// Public routes
		articles := v1.Group("/articles")
		{
			articles.GET("", r.articleHandler.GetArticles)
			// Search endpoint with rate limiting (5 req/sec, burst 20) and caching
			articles.GET("/search",
				middleware.RateLimitMiddleware(rate.Limit(5.0), 20),
				middleware.CacheMiddleware(r.cache, time.Second*30),
				r.articleHandler.SearchArticles)
			articles.GET("/trending", r.articleHandler.GetTrending)
			articles.GET("/discussed", r.articleHandler.GetDiscussed)
			// View tracking - public endpoint with rate limiting (10 req/min)
			articles.POST("/:id/track-view", middleware.RateLimitMiddleware(rate.Limit(0.16), 3), r.viewTrackingHandler.TrackView)
			articles.GET("/:id/views", r.viewTrackingHandler.GetViewCount)
			// Random articles - No cache to ensure randomness, but rate limited to prevent abuse
			// 1 request/sec, burst 5
			articles.GET("/random", middleware.RateLimitMiddleware(rate.Limit(1.0), 5), r.articleHandler.GetRandom)
			articles.GET("/:id", r.articleHandler.GetArticle)
			articles.GET("/:id/relations", r.articleHandler.GetArticleRelations)

			// Public Comment Routes (Read-only)
			articles.GET("/:id/comments", r.commentHandler.GetComments)
			articles.GET("/:id/comments/:commentId/replies", r.commentHandler.GetReplies)
			articles.GET("/:id/rating", middleware.OptionalAuthMiddleware(r.userRepo), r.ratingHandler.GetRating)
		}

		// Stats routes
		stats := v1.Group("/stats")
		{
			stats.GET("/public", middleware.CacheMiddleware(r.cache, time.Minute*5), r.statsHandler.GetPublicStats)
		}

		// Category routes
		categories := v1.Group("/categories")
		{
			categories.POST("", r.categoryHandler.CreateCategory)
			categories.GET("", middleware.CacheMiddleware(r.cache, time.Second*5), r.categoryHandler.GetCategories)
			categories.GET("/tree", middleware.CacheMiddleware(r.cache, time.Minute*10), r.categoryHandler.GetCategoryTree)
			categories.GET("/stats", middleware.CacheMiddleware(r.cache, time.Minute*5), r.categoryHandler.GetStats)
			categories.GET("/:id", r.categoryHandler.GetCategory)
			categories.PUT("/:id", r.categoryHandler.UpdateCategory)
			categories.DELETE("/:id", r.categoryHandler.DeleteCategory)
		}

		// Tag routes
		tags := v1.Group("/tags")
		{
			tags.POST("", r.tagHandler.CreateTag)
			tags.GET("", middleware.CacheMiddleware(r.cache, time.Second*5), r.tagHandler.GetTags)
			tags.GET("/stats", middleware.CacheMiddleware(r.cache, time.Minute*5), r.tagHandler.GetStats)
			tags.GET("/:id", r.tagHandler.GetTag)
			tags.PUT("/:id", r.tagHandler.UpdateTag)
			tags.DELETE("/:id", r.tagHandler.DeleteTag)
		}

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(r.userRepo))
		{
			protected.PUT("/auth/profile", r.authHandler.UpdateProfile)
			protected.PUT("/auth/password", r.authHandler.ChangePassword)
			protected.GET("/auth/me", r.authHandler.GetMe)

			protected.GET("/protected/profile", func(c *gin.Context) {
				email, _ := c.Get("email")
				c.JSON(200, gin.H{"message": "Welcome!", "email": email})
			})

			// Comment Management (Protected)
			// Rate limit: 0.33 rps (approx 20/min), burst 5
			protected.POST("/comments", middleware.RateLimitMiddleware(rate.Limit(0.33), 5), r.commentHandler.CreateComment)
			// Edit comment - similar rate limit to creation
			protected.PUT("/comments/:id", middleware.RateLimitMiddleware(rate.Limit(0.33), 5), r.commentHandler.UpdateComment)
			// Stricter rate limiting for delete/restore operations (10/min)
			protected.DELETE("/comments/:id", middleware.RateLimitMiddleware(rate.Limit(0.16), 3), r.commentHandler.DeleteComment)
			protected.PUT("/comments/:id/restore", middleware.RateLimitMiddleware(rate.Limit(0.16), 3), r.commentHandler.RestoreComment)

			// Admin Stats
			protected.GET("/admin/super-dashboard", middleware.CacheMiddleware(r.cache, time.Minute), r.dashboardHandler.GetSuperDashboard)
			protected.GET("/admin/export-dashboard", r.dashboardHandler.ExportDashboard)
			protected.GET("/admin/dashboard", middleware.CacheMiddleware(r.cache, time.Minute), r.statsHandler.GetDashboardData)
			protected.GET("/admin/analytics", middleware.CacheMiddleware(r.cache, time.Second*30), r.dashboardHandler.GetAnalytics)
			// Real-time analytics - no cache for advanced-analytics
			protected.GET("/admin/advanced-analytics", r.dashboardHandler.GetAdvancedAnalytics)
			protected.GET("/admin/analytics/hierarchy/stats", middleware.CacheMiddleware(r.cache, time.Minute*5), r.dashboardHandler.GetHierarchyStats)
			protected.GET("/admin/analytics/hierarchy/tree", middleware.CacheMiddleware(r.cache, time.Minute*10), r.dashboardHandler.GetCategoryTree)
			protected.GET("/admin/settings-stats", r.dashboardHandler.GetSettingsAnalytics)

			// User Management (Admin only - Should add role check middleware later)
			users := protected.Group("/users")
			{
				users.GET("", r.userHandler.GetUsers)
				users.GET("/stats", middleware.CacheMiddleware(r.cache, time.Minute*5), r.userHandler.GetStats)
				users.GET("/:id", r.userHandler.GetUser)
				users.PUT("/:id", r.userHandler.UpdateUser)
				users.DELETE("/:id", r.userHandler.DeleteUser)
				users.PUT("/:id/roles", r.userHandler.AssignRoles)
			}

			// Article Management (Protected)
			articles := protected.Group("/articles")
			{
				articles.POST("", r.articleHandler.CreateArticle)
				articles.PUT("/:id", r.articleHandler.UpdateArticle)
				articles.DELETE("/:id", r.articleHandler.DeleteArticle)
				articles.PUT("/:id/status", r.articleHandler.ChangeStatus)
				articles.POST("/:id/redirects", r.articleHandler.AddRedirect)
				articles.DELETE("/:id/redirects/:redirectId", r.articleHandler.DeleteRedirect)
				articles.POST("/:id/rate", r.ratingHandler.RateArticle)
			}

			protected.GET("/roles", r.userHandler.GetRoles)

			// SEO Management
			seo := protected.Group("/seo")
			{
				seo.GET("/redirects", r.seoHandler.GetRedirects)
				seo.POST("/redirects", r.seoHandler.CreateRedirect)
				seo.PUT("/redirects/:id", r.seoHandler.UpdateRedirect)
				seo.DELETE("/redirects/:id", r.seoHandler.DeleteRedirect)

				seo.GET("/article-redirects", r.seoHandler.GetArticleRedirects)
				seo.GET("/trends", r.seoHandler.GetTrends)
			}

			// System Settings & Logs
			settings := protected.Group("/settings")
			{
				settings.GET("", r.settingHandler.GetSettings)
				settings.PUT("", r.settingHandler.UpdateSettings)
			}

			logs := protected.Group("/logs")
			{
				logs.GET("/audit", r.auditHandler.GetAuditLogs)
				logs.GET("/audit/:id", r.auditHandler.GetAuditLog)
				logs.GET("/system", r.auditHandler.GetSystemLogs)
				logs.GET("/system/:id", r.auditHandler.GetSystemLog)
			}
		}
	}
}
