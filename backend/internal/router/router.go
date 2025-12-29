package router

import (
	"backend/internal/domain"
	"backend/internal/handler"
	"backend/internal/middleware"
	"backend/internal/ws"

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
	userHandler      *handler.UserHandler
	userRepo         domain.UserRepository
	wsHub            *ws.Hub
}

func NewRouter(
	articleHandler *handler.ArticleHandler,
	categoryHandler *handler.CategoryHandler,
	tagHandler *handler.TagHandler,
	authHandler *handler.AuthHandler,
	statsHandler *handler.StatsHandler,
	dashboardHandler *handler.DashboardHandler,
	userHandler *handler.UserHandler,
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
		userRepo:         userHandler.GetService().GetRepo(),
		wsHub:            wsHub,
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

	v1 := engine.Group("/api/v1")
	{
		// Auth routes
		auth := v1.Group("/auth")
		{
			auth.POST("/register", r.authHandler.Register)
			auth.POST("/login", middleware.RateLimitMiddleware(rate.Limit(5.0/60.0), 10), r.authHandler.Login)
			auth.POST("/logout", r.authHandler.Logout)
		}

		// WebSocket route
		v1.GET("/ws", func(c *gin.Context) {
			ws.ServeWs(r.wsHub, c)
		})

		// Article routes
		articles := v1.Group("/articles")
		{
			articles.POST("", r.articleHandler.CreateArticle)
			articles.GET("", r.articleHandler.GetArticles)
			articles.GET("/:id", r.articleHandler.GetArticle)
			articles.PUT("/:id", r.articleHandler.UpdateArticle)
			articles.DELETE("/:id", r.articleHandler.DeleteArticle)
		}

		// Category routes
		categories := v1.Group("/categories")
		{
			categories.POST("", r.categoryHandler.CreateCategory)
			categories.GET("", r.categoryHandler.GetCategories)
			categories.GET("/stats", r.categoryHandler.GetStats) // Make sure this is before /:id to avoid conflict if id is string. ID is UUID so it might be okay, but explicitly placing before is safer.
			categories.GET("/:id", r.categoryHandler.GetCategory)
			categories.PUT("/:id", r.categoryHandler.UpdateCategory)
			categories.DELETE("/:id", r.categoryHandler.DeleteCategory)
		}

		// Tag routes
		tags := v1.Group("/tags")
		{
			tags.POST("", r.tagHandler.CreateTag)
			tags.GET("", r.tagHandler.GetTags)
			tags.GET("/stats", r.tagHandler.GetStats)
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
			protected.GET("/admin/dashboard", r.statsHandler.GetDashboardData)
			protected.GET("/admin/analytics", r.dashboardHandler.GetAnalytics)
			protected.GET("/admin/analytics/hierarchy/stats", r.dashboardHandler.GetHierarchyStats)
			protected.GET("/admin/analytics/hierarchy/tree", r.dashboardHandler.GetCategoryTree)

			// User Management (Admin only - Should add role check middleware later)
			users := protected.Group("/users")
			{
				users.GET("", r.userHandler.GetUsers)
				users.GET("/stats", r.userHandler.GetStats)
				users.GET("/:id", r.userHandler.GetUser)
				users.PUT("/:id", r.userHandler.UpdateUser)
				users.DELETE("/:id", r.userHandler.DeleteUser)
				users.PUT("/:id/roles", r.userHandler.AssignRoles)
			}
			protected.GET("/roles", r.userHandler.GetRoles)
		}
	}
}
