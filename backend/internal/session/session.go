package session

import (
	"encoding/gob"
	"net/http"
	"time"

	"github.com/alexedwards/scs/gormstore"
	"github.com/alexedwards/scs/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func init() {
	gob.Register(uuid.UUID{})
	gob.Register([]string{})
}

var SessionManager *scs.SessionManager

func InitSession(db *gorm.DB) {
	SessionManager = scs.New()
	store, err := gormstore.New(db)
	if err != nil {
		panic(err)
	}
	SessionManager.Store = store
	SessionManager.Lifetime = 24 * time.Hour
	SessionManager.Cookie.HttpOnly = true
	SessionManager.Cookie.Secure = false // Set to true in production with HTTPS
	SessionManager.Cookie.SameSite = http.SameSiteLaxMode
	SessionManager.Cookie.Path = "/"
}
