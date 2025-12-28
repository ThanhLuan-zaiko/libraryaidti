package middleware

import (
	"backend/internal/session"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDInterface := session.SessionManager.Get(c.Request.Context(), "user_id")
		if userIDInterface == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Vui lòng đăng nhập"})
			c.Abort()
			return
		}

		userID, ok := userIDInterface.(uuid.UUID)
		if !ok {
			// Try parsing if it was stored as string (some session stores do this)
			if idStr, ok := userIDInterface.(string); ok {
				var err error
				userID, err = uuid.Parse(idStr)
				if err != nil {
					c.JSON(http.StatusUnauthorized, gin.H{"error": "ID người dùng không hợp lệ trong session"})
					c.Abort()
					return
				}
			} else {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Định dạng ID người dùng không hợp lệ"})
				c.Abort()
				return
			}
		}

		email := session.SessionManager.GetString(c.Request.Context(), "email")
		roles := session.SessionManager.Get(c.Request.Context(), "roles").([]string)

		// Set user info in context
		c.Set("user_id", userID)
		c.Set("email", email)
		c.Set("roles", roles)

		c.Next()
	}
}
