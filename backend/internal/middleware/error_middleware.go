package middleware

import (
	apperrors "backend/internal/core/error"
	"backend/internal/core/response"
	"backend/internal/logger"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorHandlerMiddleware handles errors returned by handlers and panics.
func ErrorHandlerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// 1. Handle Errors pushed to c.Errors
		if len(c.Errors) > 0 {
			err := c.Errors.Last().Err

			// Log the error
			log := logger.Get()

			// Check if it's our custom AppError
			if appErr, ok := err.(*apperrors.AppError); ok {
				// Log internal error if it exists
				if appErr.Err != nil {
					log.Error("App Error",
						"path", c.Request.URL.Path,
						"code", appErr.Code,
						"message", appErr.Message,
						"internal_error", appErr.Err.Error(),
					)
				} else {
					log.Warn("App Error",
						"path", c.Request.URL.Path,
						"code", appErr.Code,
						"message", appErr.Message,
					)
				}

				// Send standard response using the response helper
				// Note: response.Error handles AppError unwrapping, but we do it here relying on helper
				if !c.Writer.Written() {
					response.Error(c, appErr)
				}

			} else {
				// Unknown error
				log.Error("Unknown Error",
					"path", c.Request.URL.Path,
					"error", err.Error(),
				)

				if !c.Writer.Written() {
					response.Error(c, apperrors.NewInternalError(err))
				}
			}
		}
	}
}

// RecoveryMiddleware is a custom recovery middleware that uses our logger
func RecoveryMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				logger.Get().Error("Panic Recovered", "error", err, "path", c.Request.URL.Path)

				if !c.Writer.Written() {
					c.AbortWithStatus(http.StatusInternalServerError)
				}
			}
		}()
		c.Next()
	}
}
