package repository

import (
	"backend/internal/domain"

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
