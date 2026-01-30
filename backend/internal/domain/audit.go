package domain

import (
	"database/sql/driver"
	"errors"
	"time"

	"github.com/google/uuid"
)

type JSONB []byte

func (j JSONB) Value() (driver.Value, error) {
	if len(j) == 0 {
		return nil, nil
	}
	return string(j), nil
}

func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	*j = make([]byte, len(bytes))
	copy(*j, bytes)
	return nil
}

func (j JSONB) MarshalJSON() ([]byte, error) {
	if len(j) == 0 {
		return []byte("null"), nil
	}
	return j, nil
}

func (j *JSONB) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		*j = nil
		return nil
	}
	*j = make([]byte, len(data))
	copy(*j, data)
	return nil
}

type AuditLog struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    uuid.UUID `json:"user_id"`
	User      *User     `json:"user,omitempty"`
	Action    string    `json:"action" gorm:"type:varchar(100)"`
	TableName string    `json:"table_name" gorm:"type:varchar(100)"`
	RecordID  uuid.UUID `json:"record_id"`
	OldData   JSONB     `json:"old_data" gorm:"type:jsonb"`
	NewData   JSONB     `json:"new_data" gorm:"type:jsonb"`
	CreatedAt time.Time `json:"created_at" gorm:"default:now()"`
}

type SystemLog struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    *uuid.UUID `json:"user_id"`
	User      *User      `json:"user,omitempty"`
	Action    string     `json:"action" gorm:"type:varchar(100)"`
	TableName string     `json:"table_name" gorm:"type:varchar(100)"`
	RecordID  uuid.UUID  `json:"record_id"`
	OldData   JSONB      `json:"old_data" gorm:"type:jsonb"`
	NewData   JSONB      `json:"new_data" gorm:"type:jsonb"`
	CreatedAt time.Time  `json:"created_at" gorm:"default:now()"`
}

type AuditRepository interface {
	Create(log *AuditLog) error
	CreateSystemLog(log *SystemLog) error
	GetAuditLogs(page, limit int, filter map[string]interface{}) ([]AuditLog, int64, error)
	GetSystemLogs(page, limit int, filter map[string]interface{}) ([]SystemLog, int64, error)
	GetAuditLog(id uuid.UUID) (*AuditLog, error)
	GetSystemLog(id uuid.UUID) (*SystemLog, error)
	DeleteOldAuditLogs(before time.Time) error
	DeleteOldSystemLogs(before time.Time) error
}

type AuditService interface {
	LogAction(userID uuid.UUID, action, tableName string, recordID uuid.UUID, oldData, newData interface{}) error
	LogSystemEvent(userID *uuid.UUID, action, tableName string, recordID uuid.UUID, oldData, newData interface{}) error
	GetAuditLogs(page, limit int, filter map[string]interface{}) ([]AuditLog, int64, error)
	GetSystemLogs(page, limit int, filter map[string]interface{}) ([]SystemLog, int64, error)
	GetAuditLog(id uuid.UUID) (*AuditLog, error)
	GetSystemLog(id uuid.UUID) (*SystemLog, error)
	CleanupOldLogs(days int) error
}
