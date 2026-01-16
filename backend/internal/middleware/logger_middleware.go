package middleware

import (
	"backend/internal/logger"
	"time"

	"github.com/gin-gonic/gin"
)

// LoggerMiddleware logs HTTP requests using the structured logger
func LoggerMiddleware() gin.HandlerFunc {
	log := logger.Get()
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// Process request
		c.Next()

		// Log after request processing
		if raw != "" {
			path = path + "?" + raw
		}

		latency := time.Since(start)
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()

		msg := "Incoming request"
		if statusCode >= 500 {
			msg = "Server error"
		} else if statusCode >= 400 {
			msg = "Client error"
		}

		log.Info(msg,
			"method", method,
			"path", path,
			"status", statusCode,
			"latency", latency,
			"ip", clientIP,
		)
	}
}
