package middleware

import (
	"crypto/md5"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// HTTPCacheMiddleware handles Cache-Control and ETag headers
func HTTPCacheMiddleware(maxAge int) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method != http.MethodGet {
			c.Next()
			return
		}

		// Set Cache-Control
		c.Header("Cache-Control", fmt.Sprintf("public, max-age=%d", maxAge))
		c.Next()
	}
}

// SetETag sets the ETag header based on content
func SetETag(c *gin.Context, data []byte) {
	etag := fmt.Sprintf("%x", md5.Sum(data))
	c.Header("ETag", etag)

	if c.GetHeader("If-None-Match") == etag {
		c.AbortWithStatus(http.StatusNotModified)
	}
}
