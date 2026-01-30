package service

import (
	"backend/internal/domain"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type auditService struct {
	repo domain.AuditRepository
}

func NewAuditService(repo domain.AuditRepository) domain.AuditService {
	return &auditService{repo: repo}
}

func (s *auditService) LogAction(userID uuid.UUID, action, tableName string, recordID uuid.UUID, oldData, newData interface{}) error {
	oldBytes, _ := json.Marshal(oldData)
	newBytes, _ := json.Marshal(newData)

	log := &domain.AuditLog{
		ID:        uuid.New(),
		UserID:    userID,
		Action:    action,
		TableName: tableName,
		RecordID:  recordID,
		OldData:   domain.JSONB(oldBytes),
		NewData:   domain.JSONB(newBytes),
		CreatedAt: time.Now(),
	}
	return s.repo.Create(log)
}

func (s *auditService) LogSystemEvent(userID *uuid.UUID, action, tableName string, recordID uuid.UUID, oldData, newData interface{}) error {
	// Ensure we don't pass uuid.Nil as a valid user_id to database (FK violation)
	var finalUserID *uuid.UUID
	if userID != nil && *userID != uuid.Nil {
		finalUserID = userID
	}

	oldBytes, _ := json.Marshal(oldData)
	newBytes, _ := json.Marshal(newData)

	log := &domain.SystemLog{
		ID:        uuid.New(),
		UserID:    finalUserID,
		Action:    action,
		TableName: tableName,
		RecordID:  recordID,
		OldData:   domain.JSONB(oldBytes),
		NewData:   domain.JSONB(newBytes),
		CreatedAt: time.Now(),
	}
	return s.repo.CreateSystemLog(log)
}

func (s *auditService) GetAuditLogs(page, limit int, filter map[string]interface{}) ([]domain.AuditLog, int64, error) {
	return s.repo.GetAuditLogs(page, limit, filter)
}

func (s *auditService) GetSystemLogs(page, limit int, filter map[string]interface{}) ([]domain.SystemLog, int64, error) {
	return s.repo.GetSystemLogs(page, limit, filter)
}

func (s *auditService) GetAuditLog(id uuid.UUID) (*domain.AuditLog, error) {
	return s.repo.GetAuditLog(id)
}

func (s *auditService) GetSystemLog(id uuid.UUID) (*domain.SystemLog, error) {
	return s.repo.GetSystemLog(id)
}

func (s *auditService) CleanupOldLogs(days int) error {
	if days <= 0 {
		return nil
	}

	before := time.Now().AddDate(0, 0, -days)

	if err := s.repo.DeleteOldAuditLogs(before); err != nil {
		return err
	}

	return s.repo.DeleteOldSystemLogs(before)
}
