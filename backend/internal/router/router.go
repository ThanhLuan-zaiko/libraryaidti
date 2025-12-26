package router

import (
	"backend/internal/handler"
	"backend/internal/middleware"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type Router struct {
	articleHandler  *handler.ArticleHandler
	categoryHandler *handler.CategoryHandler
	authHandler     *handler.AuthHandler
	statsHandler    *handler.StatsHandler
}

func NewRouter(articleHandler *handler.ArticleHandler, categoryHandler *handler.CategoryHandler, authHandler *handler.AuthHandler, statsHandler *handler.StatsHandler) *Router {
	return &Router{
		articleHandler:  articleHandler,
		categoryHandler: categoryHandler,
		authHandler:     authHandler,
		statsHandler:    statsHandler,
	}
}

func (r *Router) Setup(engine *gin.Engine) {
	// CORS Middleware
	allowedOrigins := map[string]bool{
		"http://localhost:3000": true,
		// Thêm các domain khác ở đây
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
			auth.POST("/refresh", r.authHandler.RefreshToken)
			auth.POST("/logout", r.authHandler.Logout)
		}

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
			categories.GET("/:id", r.categoryHandler.GetCategory)
			categories.PUT("/:id", r.categoryHandler.UpdateCategory)
			categories.DELETE("/:id", r.categoryHandler.DeleteCategory)
		}

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.PUT("/auth/profile", r.authHandler.UpdateProfile)
			protected.PUT("/auth/password", r.authHandler.ChangePassword)

			protected.GET("/protected/profile", func(c *gin.Context) {
				email, _ := c.Get("email")
				c.JSON(200, gin.H{"message": "Welcome!", "email": email})
			})

			// Admin Stats
			protected.GET("/admin/dashboard", r.statsHandler.GetDashboardData)
		}
	}
}
