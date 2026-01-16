package service

import (
	"backend/internal/domain"
	"errors"
	"time"

	"github.com/google/uuid"
)

type ratingService struct {
	repo        domain.RatingRepository
	articleRepo domain.ArticleRepository
}

func NewRatingService(repo domain.RatingRepository, articleRepo domain.ArticleRepository) domain.RatingService {
	return &ratingService{
		repo:        repo,
		articleRepo: articleRepo,
	}
}

func (s *ratingService) RateArticle(articleID, userID string, details domain.RatingDetail) error {
	// Validate scores
	if details.Content < 1 || details.Content > 5 ||
		details.Clarity < 1 || details.Clarity > 5 ||
		details.Relevance < 1 || details.Relevance > 5 {
		return errors.New("điểm đánh giá cho từng tiêu chí phải từ 1 đến 5 sao")
	}

	// Calculate overall score (rounded to nearest integer)
	overallScore := int((float64(details.Content) + float64(details.Clarity) + float64(details.Relevance)) / 3.0)
	if overallScore < 1 {
		overallScore = 1 // Safety check, though logic above prevents < 1
	}

	artUUID, err := uuid.Parse(articleID)
	if err != nil {
		return errors.New("mã bài viết không hợp lệ")
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return errors.New("mã người dùng không hợp lệ")
	}

	// Check if article exists
	article, err := s.articleRepo.GetByID(artUUID)
	if err != nil {
		return errors.New("không tìm thấy bài viết")
	}

	if article.Status != domain.StatusPublished {
		return errors.New("chỉ có thể đánh giá bài viết đã xuất bản")
	}

	// Try to get existing rating
	rating, err := s.repo.GetByArticleAndUser(articleID, userID)
	if err != nil {
		// Create new
		rating = &domain.ArticleRating{
			ArticleID:      artUUID,
			UserID:         userUUID,
			Score:          overallScore,
			ContentScore:   details.Content,
			ClarityScore:   details.Clarity,
			RelevanceScore: details.Relevance,
			CreatedAt:      time.Now().UTC(),
			UpdatedAt:      time.Now().UTC(),
		}
	} else {
		// Update existing
		rating.Score = overallScore
		rating.ContentScore = details.Content
		rating.ClarityScore = details.Clarity
		rating.RelevanceScore = details.Relevance
		rating.UpdatedAt = time.Now().UTC()
	}

	return s.repo.Upsert(rating)
}

func (s *ratingService) GetRatingStats(articleID string) (float64, int64, error) {
	return s.repo.GetStats(articleID)
}

func (s *ratingService) GetUserRating(articleID, userID string) (*domain.ArticleRating, error) {
	if userID == "" {
		return nil, nil
	}
	return s.repo.GetByArticleAndUser(articleID, userID)
}
