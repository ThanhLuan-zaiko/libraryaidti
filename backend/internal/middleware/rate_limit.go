package middleware

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type IPRateLimiter struct {
	ips map[string]*rate.Limiter
	mu  *sync.RWMutex
	r   rate.Limit
	b   int
}

func NewIPRateLimiter(r rate.Limit, b int) *IPRateLimiter {
	return &IPRateLimiter{
		ips: make(map[string]*rate.Limiter),
		mu:  &sync.RWMutex{},
		r:   r,
		b:   b,
	}
}

func (i *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
	i.mu.RLock()
	limiter, exists := i.ips[ip]
	i.mu.RUnlock()

	if !exists {
		i.mu.Lock()
		defer i.mu.Unlock()
		// Double check in case another goroutine created it
		limiter, exists = i.ips[ip]
		if !exists {
			limiter = rate.NewLimiter(i.r, i.b)
			i.ips[ip] = limiter
		}
	}

	return limiter
}

// RateLimitMiddleware creates a middleware that limits requests by IP
// r: requests per second, b: burst size
func RateLimitMiddleware(r rate.Limit, b int) gin.HandlerFunc {
	limiter := NewIPRateLimiter(r, b)

	return func(c *gin.Context) {
		ip := c.ClientIP()
		l := limiter.GetLimiter(ip)

		if !l.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
				"retry_after": "Vài giây",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// GlobalRateLimitMiddleware applies a general limit to all routes
func GlobalRateLimitMiddleware() gin.HandlerFunc {
	// 50 requests per second, burst of 100 (production-ready)
	return RateLimitMiddleware(rate.Limit(50), 100)
}
