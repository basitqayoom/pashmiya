package utils

import (
	"encoding/json"
	"fmt"
	"os"
	"time"
)

type LogLevel string

const (
	LevelDebug LogLevel = "DEBUG"
	LevelInfo  LogLevel = "INFO"
	LevelWarn  LogLevel = "WARN"
	LevelError LogLevel = "ERROR"
)

type Logger struct {
	service  string
	logLevel LogLevel
}

type LogEntry struct {
	Timestamp string                 `json:"timestamp"`
	Level     string                 `json:"level"`
	Service   string                 `json:"service"`
	Message   string                 `json:"message"`
	RequestID string                 `json:"request_id,omitempty"`
	UserID    uint                   `json:"user_id,omitempty"`
	Error     string                 `json:"error,omitempty"`
	Duration  string                 `json:"duration,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

var defaultLogger *Logger

func init() {
	defaultLogger = NewLogger("pashmina-backend")
}

func NewLogger(service string) *Logger {
	level := LevelInfo
	if os.Getenv("LOG_LEVEL") != "" {
		level = LogLevel(os.Getenv("LOG_LEVEL"))
	}
	return &Logger{
		service:  service,
		logLevel: level,
	}
}

func (l *Logger) shouldLog(level LogLevel) bool {
	levels := map[LogLevel]int{
		LevelDebug: 0,
		LevelInfo:  1,
		LevelWarn:  2,
		LevelError: 3,
	}
	return levels[level] >= levels[l.logLevel]
}

func (l *Logger) log(level LogLevel, message string, fields map[string]interface{}) {
	if !l.shouldLog(level) {
		return
	}

	entry := LogEntry{
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Level:     string(level),
		Service:   l.service,
		Message:   message,
	}

	if requestID, ok := fields["request_id"]; ok {
		entry.RequestID = fmt.Sprintf("%v", requestID)
		delete(fields, "request_id")
	}

	if userID, ok := fields["user_id"]; ok {
		if uid, ok := userID.(uint); ok {
			entry.UserID = uid
		}
		delete(fields, "user_id")
	}

	if err, ok := fields["error"]; ok {
		entry.Error = fmt.Sprintf("%v", err)
		delete(fields, "error")
	}

	if duration, ok := fields["duration"]; ok {
		entry.Duration = fmt.Sprintf("%v", duration)
		delete(fields, "duration")
	}

	if len(fields) > 0 {
		entry.Metadata = fields
	}

	output, _ := json.Marshal(entry)
	fmt.Println(string(output))
}

func (l *Logger) Debug(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	l.log(LevelDebug, message, f)
}

func (l *Logger) Info(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	l.log(LevelInfo, message, f)
}

func (l *Logger) Warn(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	l.log(LevelWarn, message, f)
}

func (l *Logger) Error(message string, fields ...map[string]interface{}) {
	var f map[string]interface{}
	if len(fields) > 0 {
		f = fields[0]
	}
	l.log(LevelError, message, f)
}

func Debug(message string, fields ...map[string]interface{}) {
	defaultLogger.Debug(message, fields...)
}

func Info(message string, fields ...map[string]interface{}) {
	defaultLogger.Info(message, fields...)
}

func Warn(message string, fields ...map[string]interface{}) {
	defaultLogger.Warn(message, fields...)
}

func Error(message string, fields ...map[string]interface{}) {
	defaultLogger.Error(message, fields...)
}

func LogRequest(requestID, method, path string, statusCode int, duration time.Duration, userID uint) {
	level := LevelInfo
	if statusCode >= 400 {
		level = LevelWarn
	}
	if statusCode >= 500 {
		level = LevelError
	}

	defaultLogger.log(level, "HTTP Request", map[string]interface{}{
		"request_id": requestID,
		"method":     method,
		"path":       path,
		"status":     statusCode,
		"duration":   duration.String(),
		"user_id":    userID,
	})
}
