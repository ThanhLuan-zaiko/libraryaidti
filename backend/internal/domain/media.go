package domain

import (
	"time"

	"github.com/google/uuid"
)

// ArticleMedia represents the article_media table
type ArticleMedia struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ArticleID uuid.UUID `gorm:"type:uuid;not null" json:"article_id"`
	MediaID   uuid.UUID `gorm:"type:uuid;not null" json:"media_id"`
	UsageType string    `gorm:"type:varchar(50)" json:"usage_type"` // thumbnail, gallery, inline

	// Relations
	Article *Article   `gorm:"foreignKey:ArticleID" json:"article,omitempty"`
	Media   *MediaFile `gorm:"foreignKey:MediaID" json:"media,omitempty"`
}

// MediaFile represents the media_files table (Stub, assuming standard fields)
// MediaFile represents the media_files table (Stub, assuming standard fields)
type MediaFile struct {
	ID         uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	FileName   string     `gorm:"not null" json:"file_name"`
	FileURL    string     `gorm:"not null" json:"file_url"`
	FileType   string     `gorm:"type:varchar(50)" json:"file_type"`
	FileSize   int64      `json:"file_size"`
	UploadedBy *uuid.UUID `gorm:"type:uuid" json:"uploaded_by"`
	CreatedAt  time.Time  `gorm:"default:now()" json:"created_at"`
}

// ArticleMediaVersion represents the article_media_versions table
type ArticleMediaVersion struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ArticleMediaID uuid.UUID `gorm:"type:uuid;not null" json:"article_media_id"`
	ArticleID      uuid.UUID `gorm:"type:uuid;not null" json:"article_id"`
	MediaID        uuid.UUID `gorm:"type:uuid;not null" json:"media_id"`
	UsageType      string    `gorm:"type:varchar(50)" json:"usage_type"`
}

// MediaFileVersion represents the media_file_versions table
type MediaFileVersion struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	MediaFileID uuid.UUID `gorm:"type:uuid;not null" json:"media_file_id"`
	FileName    string    `json:"file_name"`
	FileURL     string    `gorm:"not null" json:"file_url"`
	FileType    string    `gorm:"type:varchar(50)" json:"file_type"`
	FileSize    int64     `json:"file_size"`
	UploadedBy  uuid.UUID `gorm:"type:uuid" json:"uploaded_by"`
	CreatedAt   time.Time `gorm:"default:now()" json:"created_at"`
}

type MediaRepository interface {
	// Basic Media File operations (if needed, otherwise can stay in generic file repo)
	GetMediaByID(id uuid.UUID) (*MediaFile, error)
	CreateMediaFile(media *MediaFile) error

	// Article Media operations
	AddMediaToArticle(articleMedia *ArticleMedia) error
	GetMediaByArticleID(articleID uuid.UUID) ([]ArticleMedia, error)
	GetByArticleAndUsage(articleID uuid.UUID, usageType string) ([]ArticleMedia, error)
	RemoveMediaFromArticle(articleID, mediaID uuid.UUID) error
	UpdateMediaUsage(id uuid.UUID, newUsageType string) error

	// Versioning
	CreateMediaVersion(version *ArticleMediaVersion) error
	CreateMediaFileVersion(version *MediaFileVersion) error
	GetVersionsByArticleID(articleID uuid.UUID) ([]ArticleMediaVersion, error)

	DeleteMediaByUrl(url string) error
}
