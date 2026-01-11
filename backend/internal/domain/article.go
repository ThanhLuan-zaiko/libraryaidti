package domain

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

type RelatedArticleInfo struct {
	ID    uuid.UUID `json:"id"`
	Title string    `json:"title"`
	Slug  string    `json:"slug"`
}

type ArticleStatus string

const (
	StatusDraft     ArticleStatus = "DRAFT"
	StatusReview    ArticleStatus = "REVIEW"
	StatusPublished ArticleStatus = "PUBLISHED"
	StatusScheduled ArticleStatus = "SCHEDULED"
	StatusArchived  ArticleStatus = "ARCHIVED"
)

type Article struct {
	ID           uuid.UUID     `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Title        string        `gorm:"not null" json:"title"`
	Slug         string        `gorm:"unique;not null" json:"slug"`
	Summary      string        `json:"summary"`
	Content      string        `gorm:"type:text;not null" json:"content"`
	AuthorID     uuid.UUID     `gorm:"type:uuid" json:"author_id"`
	Author       User          `gorm:"foreignKey:AuthorID" json:"author"`
	CategoryID   uuid.UUID     `gorm:"type:uuid" json:"category_id"`
	Category     Category      `gorm:"foreignKey:CategoryID" json:"category"`
	Status       ArticleStatus `gorm:"type:varchar(30);not null;default:'DRAFT'" json:"status"`
	IsFeatured   bool          `gorm:"default:false" json:"is_featured"`
	AllowComment bool          `gorm:"default:true" json:"allow_comment"`
	PublishedAt  *time.Time    `json:"published_at"`
	CreatedAt    time.Time     `gorm:"default:now()" json:"created_at"`
	UpdatedAt    time.Time     `gorm:"default:now()" json:"updated_at"`

	// Relations
	Images       []ArticleImage       `gorm:"foreignKey:ArticleID" json:"images"`
	MediaList    []ArticleMedia       `gorm:"foreignKey:ArticleID" json:"media_list"`
	Versions     []ArticleVersion     `gorm:"foreignKey:ArticleID" json:"versions"`
	StatusLogs   []ArticleStatusLog   `gorm:"foreignKey:ArticleID" json:"status_logs"`
	Tags         []Tag                `gorm:"many2many:article_tags;joinForeignKey:article_id;joinReferences:tag_id" json:"tags"`
	Related      []*Article           `gorm:"many2many:article_relations;foreignKey:id;joinForeignKey:article_id;references:id;joinReferences:related_article_id" json:"related_articles"`
	SEOMetadata  *SeoMetadata         `gorm:"foreignKey:ArticleID" json:"seo_metadata"`
	Redirects    []ArticleSeoRedirect `gorm:"foreignKey:ArticleID" json:"redirects"`
	ViewCount    int                  `gorm:"default:0" json:"view_count"`    // Keep this for stats
	CommentCount int                  `gorm:"default:0" json:"comment_count"` // Actual persisted count for performance
	ImageURL     string               `gorm:"-" json:"image_url"`             // Alias for primary image URL
}

func (a *Article) PopulateImageURL() {
	if a.ImageURL != "" {
		return
	}

	cleanUrl := func(url string) string {
		// Strip leading slashes to prevent double slashes when prepending /
		url = strings.TrimPrefix(url, "/")
		// Fix legacy paths that might contain ../../
		url = strings.ReplaceAll(url, "../../", "")
		return "/" + url
	}

	// Try primary image first
	for _, img := range a.Images {
		if img.IsPrimary {
			a.ImageURL = cleanUrl(img.ImageURL)
			return
		}
	}
	// Fallback to first image
	if len(a.Images) > 0 {
		a.ImageURL = cleanUrl(a.Images[0].ImageURL)
	}
}

// ArticleImage maps to article_images table
type ArticleImage struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ArticleID   uuid.UUID `gorm:"type:uuid;not null" json:"article_id"`
	ImageURL    string    `gorm:"not null" json:"image_url"`
	Description string    `json:"description"`
	IsPrimary   bool      `gorm:"default:false" json:"is_primary"`
	CreatedAt   time.Time `gorm:"default:now()" json:"created_at"`
}

type ArticleVersion struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ArticleID     uuid.UUID `gorm:"type:uuid;not null" json:"article_id"`
	Title         string    `json:"title"`
	Content       string    `json:"content"`
	Summary       string    `json:"summary"`
	VersionNumber int       `gorm:"not null" json:"version_number"`
	CreatedBy     uuid.UUID `gorm:"type:uuid" json:"created_by"`
	CreatedAt     time.Time `gorm:"default:now()" json:"created_at"`
}

type ArticleStatusLog struct {
	ID        uuid.UUID     `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ArticleID uuid.UUID     `gorm:"type:uuid;not null" json:"article_id"`
	OldStatus ArticleStatus `gorm:"type:varchar(30)" json:"old_status"`
	NewStatus ArticleStatus `gorm:"type:varchar(30)" json:"new_status"`
	ChangedBy uuid.UUID     `gorm:"type:uuid" json:"changed_by"`
	Note      string        `json:"note"`
	CreatedAt time.Time     `gorm:"default:now()" json:"created_at"`
}

type SeoMetadata struct {
	ID              uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ArticleID       uuid.UUID `gorm:"type:uuid;unique" json:"article_id"`
	MetaTitle       string    `gorm:"type:varchar(255)" json:"meta_title"`
	MetaDescription string    `gorm:"type:text" json:"meta_description"`
	MetaKeywords    string    `gorm:"type:text" json:"meta_keywords"`
	OgImage         string    `gorm:"type:text" json:"og_image"`
	CanonicalURL    string    `gorm:"type:text" json:"canonical_url"`
}

func (SeoMetadata) TableName() string {
	return "article_seo_metadata"
}

type ArticleRepository interface {
	Create(article *Article) error
	GetAll(offset, limit int, filter map[string]interface{}) ([]Article, int64, error)
	GetByID(id uuid.UUID) (*Article, error)
	GetBySlug(slug string) (*Article, error)
	Update(article *Article) error
	Delete(id uuid.UUID) error
	// Helper methods
	AddTags(articleID uuid.UUID, tagIDs []uuid.UUID) error
	UpdateStatus(id uuid.UUID, status ArticleStatus) error
	GetIncomingRelations(id uuid.UUID) ([]RelatedArticleInfo, error)
	GetOutgoingRelations(id uuid.UUID) ([]RelatedArticleInfo, error)
	GetTrending(limit int) ([]Article, error)
	GetDiscussed(limit int) ([]Article, error)
	GetRandom(limit int) ([]Article, error)
}

type ArticleService interface {
	CreateArticle(article *Article) error
	GetArticles(page, limit int, filter map[string]interface{}) ([]Article, int64, error)
	GetArticleByID(id uuid.UUID) (*Article, error)
	GetArticleBySlug(slug string) (*Article, error)
	UpdateArticle(article *Article) error
	DeleteArticle(id uuid.UUID) error
	ChangeStatus(id uuid.UUID, newStatus ArticleStatus, changedBy uuid.UUID, note string) error
	CreateMediaFile(media *MediaFile) error
	DeleteMediaByUrl(url string) error
	CreateArticleRedirect(articleID uuid.UUID, fromSlug string) error
	DeleteArticleRedirect(redirectID uuid.UUID) error
	GetRedirectDestination(slug string) (string, error)
	GetArticleRelations(id uuid.UUID) ([]RelatedArticleInfo, []RelatedArticleInfo, error)
	GetTrendingArticles(limit int) ([]Article, error)
	GetDiscussedArticles(limit int) ([]Article, error)
	GetRandomArticles(limit int) ([]Article, error)
}
