package service

import (
	"backend/internal/domain"
)

type dashboardService struct {
	repo domain.DashboardRepository
}

func NewDashboardService(repo domain.DashboardRepository) domain.DashboardService {
	return &dashboardService{repo: repo}
}

func (s *dashboardService) GetAnalytics() (*domain.DashboardAnalyticsData, error) {
	return s.repo.GetAnalytics()
}
