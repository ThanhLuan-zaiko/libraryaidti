package service

import (
	"backend/internal/domain"
	"sort"
)

type statsService struct {
	repo domain.StatsRepository
}

func NewStatsService(repo domain.StatsRepository) domain.StatsService {
	return &statsService{repo: repo}
}

func (s *statsService) GetDashboardData() (*domain.DashboardData, error) {
	stats, err := s.repo.GetAdminStats()
	if err != nil {
		return nil, err
	}

	activities, err := s.repo.GetRecentActivities(10)
	if err != nil {
		return nil, err
	}

	// Sort activities by timestamp descending
	sort.Slice(activities, func(i, j int) bool {
		return activities[i].Timestamp.After(activities[j].Timestamp)
	})

	// Limit to top 10 after combining and sorting
	if len(activities) > 10 {
		activities = activities[:10]
	}

	// Fetch analytics (last 7 days)
	analytics, err := s.repo.GetAnalytics(7)
	if err != nil {
		// Log error but continue with empty analytics
		analytics = []domain.AnalyticsData{}
	}

	// Fetch category distribution
	distribution, err := s.repo.GetCategoryDistribution()
	if err != nil {
		distribution = []domain.CategoryDistribution{}
	}

	return &domain.DashboardData{
		Stats:                *stats,
		Activities:           activities,
		Analytics:            analytics,
		CategoryDistribution: distribution,
	}, nil
}
