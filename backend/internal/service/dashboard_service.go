package service

import (
	"backend/internal/domain"
	"bytes"
	"encoding/csv"
	"fmt"
	"runtime"
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

func (s *dashboardService) GetAdvancedAnalytics() (*domain.AdvancedAnalyticsData, error) {
	return s.repo.GetAdvancedAnalytics()
}

func (s *dashboardService) GetCategoryHierarchyStats() (*domain.CategoryHierarchyStats, error) {
	return s.repo.GetCategoryHierarchyStats()
}

func (s *dashboardService) GetCategoryTree() ([]domain.CategoryNode, error) {
	return s.repo.GetCategoryTree()
}

func (s *dashboardService) GetSuperDashboard() (*domain.SuperDashboardData, error) {
	data, err := s.repo.GetSuperDashboard()
	if err != nil {
		return nil, err
	}

	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	data.Pulse.GoRoutines = runtime.NumGoroutine()
	data.Pulse.MemoryUsage = m.Alloc
	data.Pulse.CPUUsage = float64(runtime.NumCPU())

	return data, nil
}

func (s *dashboardService) ExportDashboardData() ([]byte, error) {
	data, err := s.GetSuperDashboard()
	if err != nil {
		return nil, err
	}

	b := &bytes.Buffer{}
	w := csv.NewWriter(b)

	// Section 1: General Stats
	w.Write([]string{"--- GENERAL STATISTICS ---"})
	w.Write([]string{"Metric", "Value"})
	w.Write([]string{"Total Articles", fmt.Sprintf("%d", data.Stats.TotalArticles)})
	w.Write([]string{"Total Views", fmt.Sprintf("%d", data.Stats.TotalViews)})
	w.Write([]string{"Total Comments", fmt.Sprintf("%d", data.Stats.TotalComments)})
	w.Write([]string{"Total Users", fmt.Sprintf("%d", data.UserStats.TotalUsers)})
	w.Write([]string{""})

	// Section 2: Engagement
	w.Write([]string{"--- ENGAGEMENT ---"})
	w.Write([]string{"Total Shares", fmt.Sprintf("%d", data.Engagement.TotalShares)})
	w.Write([]string{"Total Comments", fmt.Sprintf("%d", data.Engagement.TotalComments)})
	w.Write([]string{"Spam Comments", fmt.Sprintf("%d", data.Engagement.SpamComments)})
	w.Write([]string{"Featured Articles", fmt.Sprintf("%d", data.Engagement.FeaturedCount)})
	w.Write([]string{""})

	// Section 3: System Health
	w.Write([]string{"--- SYSTEM HEALTH ---"})
	w.Write([]string{"CPU Cores", fmt.Sprintf("%.0f", data.Pulse.CPUUsage)})
	w.Write([]string{"Goroutines", fmt.Sprintf("%d", data.Pulse.GoRoutines)})
	w.Write([]string{"DB Connections", fmt.Sprintf("%d", data.Pulse.DBConnections)})
	w.Write([]string{"Uptime (Seconds)", fmt.Sprintf("%d", data.Pulse.UptimeSeconds)})
	w.Write([]string{""})

	// Section 4: Editorial Velocity
	w.Write([]string{"--- EDITORIAL VELOCITY ---"})
	w.Write([]string{"Avg Days (Draft to Publish)", fmt.Sprintf("%.2f", data.Velocity.DraftToPublishDays)})
	w.Write([]string{"Total Published", fmt.Sprintf("%d", data.Velocity.TotalPublished)})

	w.Flush()
	return b.Bytes(), nil
}
