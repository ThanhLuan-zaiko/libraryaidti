package middleware

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// TimeoutMiddleware enforces a timeout on the request context
func TimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Create a context that is cancelled on timeout
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()

		// Replace the request context
		c.Request = c.Request.WithContext(ctx)

		// Channel to signal when the request is done
		finishChan := make(chan struct{})
		go func() {
			c.Next()
			finishChan <- struct{}{}
		}()

		select {
		case <-finishChan:
			return
		case <-ctx.Done():
			if ctx.Err() == context.DeadlineExceeded {
				c.JSON(http.StatusGatewayTimeout, gin.H{"error": "Yêu cầu xử lý quá lâu. Vui lòng thử lại sau."})
				c.Abort()
			}
		}
	}
}
