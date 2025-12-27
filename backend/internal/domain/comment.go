package domain

import (
	"time"

	"github.com/google/uuid"
)

type Comment struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ArticleID uuid.UUID  `gorm:"type:uuid;not null" json:"article_id"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	Content   string     `gorm:"not null" json:"content"`
	ParentID  *uuid.UUID `gorm:"type:uuid" json:"parent_id"`
	IsSpam    bool       `gorm:"default:false" json:"is_spam"`
	IsDeleted bool       `gorm:"default:false" json:"is_deleted"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`

	// Associations
	User    *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Replies []Comment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
}
