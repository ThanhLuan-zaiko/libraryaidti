package domain

import (
	"time"

	"github.com/google/uuid"
)

type Category struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name        string     `gorm:"not null" json:"name"`
	Slug        string     `gorm:"unique;not null" json:"slug"`
	ParentID    *uuid.UUID `gorm:"type:uuid" json:"parent_id"`
	Description string     `json:"description"`
	IsActive    bool       `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time  `gorm:"default:now()" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"default:now()" json:"updated_at"`

	Parent   *Category  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children []Category `gorm:"foreignKey:ParentID" json:"children,omitempty"`
}

type CategoryStats struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	ArticleCount int64     `json:"article_count"`
}

type Tag struct {
	ID   uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name string    `gorm:"unique;not null" json:"name"`
	Slug string    `gorm:"unique;not null" json:"slug"`
}

type TagStats struct {
	ID         uuid.UUID `json:"id"`
	Name       string    `json:"name"`
	Slug       string    `json:"slug"`
	UsageCount int64     `json:"usage_count"`
}

type CategoryRepository interface {
	Create(category *Category) error
	GetAll() ([]Category, error)
	GetByID(id uuid.UUID) (*Category, error)
	GetBySlug(slug string) (*Category, error)
	GetList(page, limit int, search, sortBy, order string) (*PaginatedResult[Category], error)
	GetStats() ([]CategoryStats, error)
	Update(category *Category) error
	Delete(id uuid.UUID) error
}
type TagRepository interface {
	Create(tag *Tag) error
	GetAll() ([]Tag, error)
	GetByID(id uuid.UUID) (*Tag, error)
	GetBySlug(slug string) (*Tag, error)
	GetList(page, limit int, search, sortBy, order string) (*PaginatedResult[Tag], error)
	GetStats() ([]TagStats, error)
	Update(tag *Tag) error
	Delete(id uuid.UUID) error
}

type CategoryService interface {
	CreateCategory(category *Category) error
	GetCategories() ([]Category, error)
	GetCategoryByID(id uuid.UUID) (*Category, error)
	GetCategoryBySlug(slug string) (*Category, error)
	GetCategoryList(page, limit int, search, sortBy, order string) (*PaginatedResult[Category], error)
	GetCategoryStats() ([]CategoryStats, error)
	UpdateCategory(category *Category) error
	DeleteCategory(id uuid.UUID) error
}

type TagService interface {
	CreateTag(tag *Tag) error
	GetTags() ([]Tag, error)
	GetTagByID(id uuid.UUID) (*Tag, error)
	GetTagBySlug(slug string) (*Tag, error)
	GetTagList(page, limit int, search, sortBy, order string) (*PaginatedResult[Tag], error)
	GetTagStats() ([]TagStats, error)
	UpdateTag(tag *Tag) error
	DeleteTag(id uuid.UUID) error
}
