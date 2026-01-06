package repository

import (
	"backend/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type mediaRepository struct {
	db *gorm.DB
}

func NewMediaRepository(db *gorm.DB) domain.MediaRepository {
	return &mediaRepository{db: db}
}

func (r *mediaRepository) GetMediaByID(id uuid.UUID) (*domain.MediaFile, error) {
	var media domain.MediaFile
	if err := r.db.First(&media, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &media, nil
}

func (r *mediaRepository) CreateMediaFile(media *domain.MediaFile) error {
	return r.db.Create(media).Error
}

func (r *mediaRepository) AddMediaToArticle(articleMedia *domain.ArticleMedia) error {
	return r.db.Create(articleMedia).Error
}

func (r *mediaRepository) GetMediaByArticleID(articleID uuid.UUID) ([]domain.ArticleMedia, error) {
	var records []domain.ArticleMedia
	err := r.db.Preload("Media").Where("article_id = ?", articleID).Find(&records).Error
	return records, err
}

func (r *mediaRepository) GetByArticleAndUsage(articleID uuid.UUID, usageType string) ([]domain.ArticleMedia, error) {
	var records []domain.ArticleMedia
	err := r.db.Preload("Media").
		Where("article_id = ? AND usage_type = ?", articleID, usageType).
		Find(&records).Error
	return records, err
}

func (r *mediaRepository) RemoveMediaFromArticle(articleID, mediaID uuid.UUID) error {
	return r.db.Delete(&domain.ArticleMedia{}, "article_id = ? AND media_id = ?", articleID, mediaID).Error
}

func (r *mediaRepository) UpdateMediaUsage(id uuid.UUID, newUsageType string) error {
	return r.db.Model(&domain.ArticleMedia{}).
		Where("id = ?", id).
		Update("usage_type", newUsageType).Error
}

// Versioning

func (r *mediaRepository) CreateMediaVersion(version *domain.ArticleMediaVersion) error {
	return r.db.Create(version).Error
}

func (r *mediaRepository) CreateMediaFileVersion(version *domain.MediaFileVersion) error {
	return r.db.Create(version).Error
}

func (r *mediaRepository) GetVersionsByArticleID(articleID uuid.UUID) ([]domain.ArticleMediaVersion, error) {
	var versions []domain.ArticleMediaVersion
	err := r.db.Where("article_id = ?", articleID).Find(&versions).Error
	return versions, err
}

func (r *mediaRepository) DeleteMediaByUrl(url string) error {
	return r.db.Delete(&domain.MediaFile{}, "file_url = ?", url).Error
}
