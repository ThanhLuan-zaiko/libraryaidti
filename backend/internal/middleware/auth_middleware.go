package middleware

import (
	"backend/internal/domain"
	"backend/internal/session"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func AuthMiddleware(userRepo domain.UserRepository) gin.HandlerFunc {
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

		// Check if user exists and is active
		user, err := userRepo.GetUserByID(userID)
		if err != nil || !user.IsActive {
			// Clear session
			session.SessionManager.Destroy(c.Request.Context())
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "ACCOUNT_LOCKED",
				"message": "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.",
			})
			c.Abort()
			return
		}

		// Build roles list from DB to ensure real-time updates
		roles := make([]string, len(user.Roles))
		for i, r := range user.Roles {
			roles[i] = r.Name
		}

		// Set user info in context
		c.Set("user_id", userID)
		c.Set("email", user.Email)
		c.Set("roles", roles)
		c.Set("full_name", user.FullName)

		c.Next()
	}
}
