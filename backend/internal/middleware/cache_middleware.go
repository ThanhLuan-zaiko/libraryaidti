package middleware

import (
	"bytes"
	"crypto/md5"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/sync/singleflight"
)

type cacheItem struct {
	content     []byte
	contentType string
	statusCode  int
	expiration  time.Time
}

type ResponseCache struct {
	items map[string]cacheItem
	mu    sync.RWMutex
	sf    singleflight.Group
}

func NewResponseCache() *ResponseCache {
	return &ResponseCache{
		items: make(map[string]cacheItem),
	}
}

// responseWriter captures the response
type responseWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w *responseWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func (w *responseWriter) WriteString(s string) (int, error) {
	w.body.WriteString(s)
	return w.ResponseWriter.WriteString(s)
}

func CacheMiddleware(cache *ResponseCache, ttl time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Only cache GET requests
		if c.Request.Method != http.MethodGet {
			c.Next()
			return
		}

		key := c.Request.URL.RequestURI()

		// If authenticated, make the cache key user-specific
		if userID, exists := c.Get("user_id"); exists {
			key = fmt.Sprintf("%s:%v", key, userID)
		}

		// 1. Check if cache exists
		cache.mu.RLock()
		item, found := cache.items[key]
		cache.mu.RUnlock()

		if found && time.Now().Before(item.expiration) {
			// ETag validation
			etag := fmt.Sprintf("%x", md5.Sum(item.content))
			c.Header("ETag", etag)

			if c.GetHeader("If-None-Match") == etag {
				c.AbortWithStatus(http.StatusNotModified)
				return
			}

			c.Data(item.statusCode, item.contentType, item.content)
			c.Abort()
			return
		}

		// 2. Use singleflight to prevent multiple concurrent requests for the same key
		cache.sf.Do(key, func() (interface{}, error) {
			// Double check cache inside singleflight
			cache.mu.RLock()
			item, found = cache.items[key]
			cache.mu.RUnlock()
			if found && time.Now().Before(item.expiration) {
				return nil, nil
			}

			// Capture response
			rw := &responseWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
			c.Writer = rw

			c.Next()

			// Only cache successful responses
			if c.Writer.Status() == http.StatusOK {
				cache.mu.Lock()
				cache.items[key] = cacheItem{
					content:     rw.body.Bytes(),
					contentType: c.Writer.Header().Get("Content-Type"),
					statusCode:  c.Writer.Status(),
					expiration:  time.Now().Add(ttl),
				}
				cache.mu.Unlock()
			}
			return nil, nil
		})

		// 3. After singleflight, check cache again to serve waiting requests
		cache.mu.RLock()
		item, found = cache.items[key]
		cache.mu.RUnlock()

		if found && time.Now().Before(item.expiration) {
			// Serve from cache (this handles the requests that were waiting in singleflight)
			// But check if we already served the response in this specific request (the one that actually called c.Next)
			if !c.Writer.Written() {
				etag := fmt.Sprintf("%x", md5.Sum(item.content))
				c.Header("ETag", etag)
				if c.GetHeader("If-None-Match") == etag {
					c.AbortWithStatus(http.StatusNotModified)
					return
				}
				c.Data(item.statusCode, item.contentType, item.content)
				c.Abort()
			}
		}
	}
}
