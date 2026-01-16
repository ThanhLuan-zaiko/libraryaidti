package logger

import (
	"context"
	"log/slog"
	"os"
	"sync"
)

var (
	once   sync.Once
	logger *slog.Logger
)

// Options configuration for logger
type Options struct {
	Level        slog.Level
	IsProduction bool
}

// Init initializes the global logger
func Init(opts Options) {
	once.Do(func() {
		var handler slog.Handler

		logLevel := &slog.LevelVar{}
		logLevel.Set(opts.Level)

		handlerOpts := &slog.HandlerOptions{
			Level:     logLevel,
			AddSource: !opts.IsProduction, // Show source file in dev mode
		}

		if opts.IsProduction {
			handler = slog.NewJSONHandler(os.Stdout, handlerOpts)
		} else {
			handler = slog.NewTextHandler(os.Stdout, handlerOpts)
		}

		logger = slog.New(handler)
		slog.SetDefault(logger)
	})
}

// Get returns the global logger instance
func Get() *slog.Logger {
	if logger == nil {
		// Fallback if not initialized
		return slog.Default()
	}
	return logger
}

// WithContext adds context fields to the logger (placeholder for potential tracing/requestID)
func WithContext(ctx context.Context) *slog.Logger {
	// In the future, we can extract RequestID or UserID from context here
	// val := ctx.Value("request_id")
	// if val != nil { return logger.With("request_id", val) }
	return Get()
}
