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
	articleHandler   *handler.ArticleHandler
	categoryHandler  *handler.CategoryHandler
	tagHandler       *handler.TagHandler
	authHandler      *handler.AuthHandler
	statsHandler     *handler.StatsHandler
	dashboardHandler *handler.DashboardHandler
	parentHandler    *handler.UserHandler // Alias or keeping userHandler is fine, just adding uploadHandler
	userHandler      *handler.UserHandler
	uploadHandler    *handler.UploadHandler
	userRepo         domain.UserRepository
	wsHub            *ws.Hub
	cache            *middleware.ResponseCache
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
	wsHub *ws.Hub,
) *Router {
	return &Router{
		articleHandler:   articleHandler,
		categoryHandler:  categoryHandler,
		tagHandler:       tagHandler,
		authHandler:      authHandler,
		statsHandler:     statsHandler,
		dashboardHandler: dashboardHandler,
		userHandler:      userHandler,
		uploadHandler:    uploadHandler,
		userRepo:         userHandler.GetService().GetRepo(),
		wsHub:            wsHub,
		cache:            middleware.NewResponseCache(),
	}
}

func (r *Router) Setup(engine *gin.Engine) {
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
	engine.Static("/uploads", "./uploads")

	// WebSocket route - bypass global rate limiting to avoid connection drops during navigation
	engine.GET("/api/v1/ws", func(c *gin.Context) {
		ws.ServeWs(r.wsHub, c)
	})

	v1 := engine.Group("/api/v1")
	v1.Use(middleware.GlobalRateLimitMiddleware())
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

		// Article routes (Public read)
		articles := v1.Group("/articles")
		{
			articles.GET("", r.articleHandler.GetArticles)
			articles.GET("/:id", r.articleHandler.GetArticle)
		}

		// Category routes
		categories := v1.Group("/categories")
		{
			categories.POST("", r.categoryHandler.CreateCategory)
			categories.GET("", r.categoryHandler.GetCategories)
			categories.GET("/stats", middleware.HTTPCacheMiddleware(300), middleware.CacheMiddleware(r.cache, time.Minute*5), r.categoryHandler.GetStats)
			categories.GET("/:id", r.categoryHandler.GetCategory)
			categories.PUT("/:id", r.categoryHandler.UpdateCategory)
			categories.DELETE("/:id", r.categoryHandler.DeleteCategory)
		}

		// Tag routes
		tags := v1.Group("/tags")
		{
			tags.POST("", r.tagHandler.CreateTag)
			tags.GET("", r.tagHandler.GetTags)
			tags.GET("/stats", middleware.HTTPCacheMiddleware(300), middleware.CacheMiddleware(r.cache, time.Minute*5), r.tagHandler.GetStats)
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

			// Admin Stats
			protected.GET("/admin/super-dashboard", middleware.CacheMiddleware(r.cache, time.Minute), r.dashboardHandler.GetSuperDashboard)
			protected.GET("/admin/export-dashboard", r.dashboardHandler.ExportDashboard)
			protected.GET("/admin/dashboard", middleware.CacheMiddleware(r.cache, time.Minute), r.statsHandler.GetDashboardData)
			protected.GET("/admin/analytics", middleware.CacheMiddleware(r.cache, time.Minute*2), r.dashboardHandler.GetAnalytics)
			protected.GET("/admin/advanced-analytics", middleware.CacheMiddleware(r.cache, time.Minute*2), r.dashboardHandler.GetAdvancedAnalytics)
			protected.GET("/admin/analytics/hierarchy/stats", middleware.CacheMiddleware(r.cache, time.Minute*5), r.dashboardHandler.GetHierarchyStats)
			protected.GET("/admin/analytics/hierarchy/tree", middleware.CacheMiddleware(r.cache, time.Minute*10), r.dashboardHandler.GetCategoryTree)

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
			}

			protected.GET("/roles", r.userHandler.GetRoles)
		}
	}
}
