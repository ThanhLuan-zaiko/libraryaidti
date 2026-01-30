package repository

import (
	"backend/internal/domain"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type auditRepository struct {
	db *gorm.DB
}

func NewAuditRepository(db *gorm.DB) domain.AuditRepository {
	return &auditRepository{db: db}
}

func (r *auditRepository) Create(log *domain.AuditLog) error {
	return r.db.Create(log).Error
}

func (r *auditRepository) CreateSystemLog(log *domain.SystemLog) error {
	return r.db.Create(log).Error
}

func (r *auditRepository) GetAuditLogs(page, limit int, filter map[string]interface{}) ([]domain.AuditLog, int64, error) {
	var logs []domain.AuditLog
	var total int64

	query := r.db.Model(&domain.AuditLog{}).Preload("User")

	if userID, ok := filter["user_id"]; ok {
		query = query.Where("user_id = ?", userID)
	}
	if action, ok := filter["action"]; ok {
		query = query.Where("action = ?", action)
	}
	if tableName, ok := filter["table_name"]; ok {
		query = query.Where("table_name = ?", tableName)
	}
	if search, ok := filter["search"]; ok && search != "" {
		s := "%" + search.(string) + "%"
		query = query.Where("action ILIKE ? OR table_name ILIKE ? OR record_id ILIKE ?", s, s, s)
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err = query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error
	return logs, total, err
}

func (r *auditRepository) GetSystemLogs(page, limit int, filter map[string]interface{}) ([]domain.SystemLog, int64, error) {
	var logs []domain.SystemLog
	var total int64

	query := r.db.Model(&domain.SystemLog{}).Preload("User")

	if userID, ok := filter["user_id"]; ok {
		query = query.Where("user_id = ?", userID)
	}
	if action, ok := filter["action"]; ok {
		query = query.Where("action = ?", action)
	}
	if search, ok := filter["search"]; ok && search != "" {
		s := "%" + search.(string) + "%"
		query = query.Where("action ILIKE ? OR old_data::text ILIKE ? OR new_data::text ILIKE ?", s, s, s)
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err = query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error
	return logs, total, err
}

func (r *auditRepository) GetAuditLog(id uuid.UUID) (*domain.AuditLog, error) {
	var log domain.AuditLog
	err := r.db.Preload("User").First(&log, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &log, nil
}

func (r *auditRepository) GetSystemLog(id uuid.UUID) (*domain.SystemLog, error) {
	var log domain.SystemLog
	err := r.db.Preload("User").First(&log, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &log, nil
}

func (r *auditRepository) DeleteOldAuditLogs(before time.Time) error {
	return r.db.Where("created_at < ?", before).Delete(&domain.AuditLog{}).Error
}

func (r *auditRepository) DeleteOldSystemLogs(before time.Time) error {
	return r.db.Where("created_at < ?", before).Delete(&domain.SystemLog{}).Error
}
