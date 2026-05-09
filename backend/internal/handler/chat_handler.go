package handler

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/Wei-Shaw/sub2api/internal/pkg/response"
	middleware2 "github.com/Wei-Shaw/sub2api/internal/server/middleware"
	"github.com/Wei-Shaw/sub2api/internal/service"

	"github.com/gin-gonic/gin"
)

// ChatHandler handles chat-related HTTP requests.
type ChatHandler struct {
	chatService    *service.ChatService
	gatewayBaseURL string
}

// NewChatHandler creates a new ChatHandler.
// gatewayBaseURL is the base URL for internal gateway calls (e.g., "http://127.0.0.1:8080").
func NewChatHandler(chatService *service.ChatService, gatewayBaseURL string) *ChatHandler {
	return &ChatHandler{
		chatService:    chatService,
		gatewayBaseURL: gatewayBaseURL,
	}
}

// CreateConversationRequest represents the create conversation payload.
type CreateConversationRequest struct {
	APIKeyID int64  `json:"api_key_id" binding:"required"`
	Model    string `json:"model"`
	Title    string `json:"title"`
}

// UpdateConversationRequest represents the update conversation payload.
type UpdateConversationRequest struct {
	Title *string `json:"title"`
	Model *string `json:"model"`
}

// SendMessageRequest represents the send message payload.
type ChatSendMessageRequest struct {
	Content     string                   `json:"content"`
	Model       string                   `json:"model"`
	Attachments []service.ChatAttachment `json:"attachments"`
}

// ListConversations handles GET /api/v1/chat/conversations
func (h *ChatHandler) ListConversations(c *gin.Context) {
	subject, ok := middleware2.GetAuthSubjectFromContext(c)
	if !ok {
		response.Unauthorized(c, "User not authenticated")
		return
	}

	page, pageSize := response.ParsePagination(c)
	conversations, total, err := h.chatService.ListConversations(c.Request.Context(), subject.UserID, page, pageSize)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}

	response.Paginated(c, conversations, total, page, pageSize)
}

// CreateConversation handles POST /api/v1/chat/conversations
func (h *ChatHandler) CreateConversation(c *gin.Context) {
	subject, ok := middleware2.GetAuthSubjectFromContext(c)
	if !ok {
		response.Unauthorized(c, "User not authenticated")
		return
	}

	var req CreateConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	conv, err := h.chatService.CreateConversation(c.Request.Context(), subject.UserID, req.APIKeyID, req.Title, req.Model)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}

	response.Created(c, conv)
}

// GetConversation handles GET /api/v1/chat/conversations/:id
func (h *ChatHandler) GetConversation(c *gin.Context) {
	subject, ok := middleware2.GetAuthSubjectFromContext(c)
	if !ok {
		response.Unauthorized(c, "User not authenticated")
		return
	}

	convID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid conversation ID")
		return
	}

	conv, messages, err := h.chatService.GetConversation(c.Request.Context(), subject.UserID, convID)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}

	response.Success(c, gin.H{
		"conversation": conv,
		"messages":     messages,
	})
}

// UpdateConversation handles PUT /api/v1/chat/conversations/:id
func (h *ChatHandler) UpdateConversation(c *gin.Context) {
	subject, ok := middleware2.GetAuthSubjectFromContext(c)
	if !ok {
		response.Unauthorized(c, "User not authenticated")
		return
	}

	convID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid conversation ID")
		return
	}

	var req UpdateConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	conv, err := h.chatService.UpdateConversation(c.Request.Context(), subject.UserID, convID, req.Title, req.Model)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}

	response.Success(c, conv)
}

// DeleteConversation handles DELETE /api/v1/chat/conversations/:id
func (h *ChatHandler) DeleteConversation(c *gin.Context) {
	subject, ok := middleware2.GetAuthSubjectFromContext(c)
	if !ok {
		response.Unauthorized(c, "User not authenticated")
		return
	}

	convID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid conversation ID")
		return
	}

	err = h.chatService.DeleteConversation(c.Request.Context(), subject.UserID, convID)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}

	response.Success(c, gin.H{"message": "Conversation deleted successfully"})
}

// SendMessage handles POST /api/v1/chat/conversations/:id/messages
// Responds with SSE (text/event-stream) for streaming.
func (h *ChatHandler) SendMessage(c *gin.Context) {
	subject, ok := middleware2.GetAuthSubjectFromContext(c)
	if !ok {
		response.Unauthorized(c, "User not authenticated")
		return
	}

	convID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid conversation ID")
		return
	}

	var req ChatSendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	// Set SSE headers
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("X-Accel-Buffering", "no")
	c.Writer.WriteHeader(http.StatusOK)

	// Create SSE writer
	flusher := &ginSSEWriter{writer: c.Writer}

	err = h.chatService.SendMessage(c.Request.Context(), subject.UserID, convID, req.Content, req.Model, req.Attachments, flusher, h.gatewayBaseURL)
	if err != nil {
		// If we haven't started streaming yet, we can write an error event
		fmt.Fprintf(flusher, "data: {\"error\": \"%s\"}\n\n", err.Error())
		flusher.Flush()
	}
}

// DeleteMessage handles DELETE /api/v1/chat/conversations/:id/messages/:mid
func (h *ChatHandler) DeleteMessage(c *gin.Context) {
	subject, ok := middleware2.GetAuthSubjectFromContext(c)
	if !ok {
		response.Unauthorized(c, "User not authenticated")
		return
	}

	convID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid conversation ID")
		return
	}

	msgID, err := strconv.ParseInt(c.Param("mid"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid message ID")
		return
	}

	err = h.chatService.DeleteMessage(c.Request.Context(), subject.UserID, convID, msgID)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}

	response.Success(c, gin.H{"message": "Message deleted successfully"})
}

// GetAvailableKeys handles GET /api/v1/chat/available-keys
func (h *ChatHandler) GetAvailableKeys(c *gin.Context) {
	subject, ok := middleware2.GetAuthSubjectFromContext(c)
	if !ok {
		response.Unauthorized(c, "User not authenticated")
		return
	}

	keys, err := h.chatService.GetAvailableKeys(c.Request.Context(), subject.UserID)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}

	response.Success(c, keys)
}

// GetModelsForKey handles GET /api/v1/chat/available-keys/:id/models
func (h *ChatHandler) GetModelsForKey(c *gin.Context) {
	subject, ok := middleware2.GetAuthSubjectFromContext(c)
	if !ok {
		response.Unauthorized(c, "User not authenticated")
		return
	}

	keyID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid key ID")
		return
	}

	models, err := h.chatService.GetModelsForKey(c.Request.Context(), subject.UserID, keyID, h.gatewayBaseURL)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}

	response.Success(c, models)
}

// ChatGenerateImageRequest represents the image generation payload.
type ChatGenerateImageRequest struct {
	Prompt      string                   `json:"prompt"`
	Model       string                   `json:"model"`
	Size        string                   `json:"size"`
	N           int                      `json:"n"`
	Attachments []service.ChatAttachment `json:"attachments"`
}

// GenerateImage handles POST /api/v1/chat/conversations/:id/images
func (h *ChatHandler) GenerateImage(c *gin.Context) {
	subject, ok := middleware2.GetAuthSubjectFromContext(c)
	if !ok {
		response.Unauthorized(c, "User not authenticated")
		return
	}

	convID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid conversation ID")
		return
	}

	var req ChatGenerateImageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	result, err := h.chatService.GenerateImage(
		c.Request.Context(),
		subject.UserID,
		convID,
		service.ImageGenerateRequest{
			Prompt:      req.Prompt,
			Model:       req.Model,
			Size:        req.Size,
			N:           req.N,
			Attachments: req.Attachments,
		},
		h.gatewayBaseURL,
	)
	if err != nil {
		response.ErrorFrom(c, err)
		return
	}

	response.Success(c, result)
}

// ginSSEWriter adapts gin.ResponseWriter to service.SSEWriter interface.
type ginSSEWriter struct {
	writer gin.ResponseWriter
}

func (w *ginSSEWriter) Write(p []byte) (n int, err error) {
	return w.writer.Write(p)
}

func (w *ginSSEWriter) Flush() {
	w.writer.Flush()
}
