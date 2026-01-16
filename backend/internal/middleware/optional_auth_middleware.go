package middleware

import (
	"backend/internal/domain"
	"backend/internal/session"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// OptionalAuthMiddleware allows both authenticated and unauthenticated requests
// If user is authenticated, it sets user info in context
// If not authenticated, the request continues without user context
func OptionalAuthMiddleware(userRepo domain.UserRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDInterface := session.SessionManager.Get(c.Request.Context(), "user_id")
		if userIDInterface == nil {
			// No session, continue without auth
			c.Next()
			return
		}

		userID, ok := userIDInterface.(uuid.UUID)
		if !ok {
			// Try parsing if it was stored as string
			if idStr, ok := userIDInterface.(string); ok {
				var err error
				userID, err = uuid.Parse(idStr)
				if err != nil {
					// Invalid format, continue without auth
					c.Next()
					return
				}
			} else {
				// Invalid type, continue without auth
				c.Next()
				return
			}
		}

		// User session exists, verify user is active
		user, err := userRepo.GetUserByID(userID)
		if err != nil || !user.IsActive {
			// User not found or inactive, continue without auth
			c.Next()
			return
		}

		// Build roles list
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
