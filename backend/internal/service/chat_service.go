package service

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
)

// Chat-specific error sentinels.
var (
	ErrConversationNotFound = infraerrors.NotFound("CONVERSATION_NOT_FOUND", "conversation not found")
	ErrConversationForbid   = infraerrors.Forbidden("CONVERSATION_FORBIDDEN", "not authorized to access this conversation")
	ErrChatNoAvailableKey   = infraerrors.NotFound("CHAT_NO_AVAILABLE_KEY", "no available API key for chat")
)

// Conversation represents a chat conversation.
type Conversation struct {
	ID            int64      `json:"id"`
	UserID        int64      `json:"user_id"`
	APIKeyID      int64      `json:"api_key_id"`
	Title         string     `json:"title"`
	Model         string     `json:"model"`
	LastMessageAt *time.Time `json:"last_message_at"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// ChatMessage represents a message in a conversation.
type ChatMessage struct {
	ID             int64                  `json:"id"`
	ConversationID int64                  `json:"conversation_id"`
	Role           string                 `json:"role"`
	Content        string                 `json:"content"`
	ContentType    string                 `json:"content_type"`
	ImageURLs      []string               `json:"image_urls,omitempty"`
	Model          string                 `json:"model,omitempty"`
	TokensUsed     int                    `json:"tokens_used"`
	CostUSD        float64                `json:"cost_usd"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt      time.Time              `json:"created_at"`
}

// ChatAvailableKey represents an API key available for chat.
type ChatAvailableKey struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	GroupID   int64  `json:"group_id"`
	GroupName string `json:"group_name"`
	Platform  string `json:"platform"`
}

// ChatRepository defines the data access interface for chat.
type ChatRepository interface {
	CreateConversation(ctx context.Context, userID, apiKeyID int64, title, model string) (*Conversation, error)
	GetConversation(ctx context.Context, id int64) (*Conversation, error)
	ListConversations(ctx context.Context, userID int64, page, pageSize int) ([]*Conversation, int64, error)
	UpdateConversation(ctx context.Context, id int64, title, model *string) (*Conversation, error)
	DeleteConversation(ctx context.Context, id int64) error
	UpdateConversationLastMessageAt(ctx context.Context, id int64, t time.Time) error

	CreateMessage(ctx context.Context, conversationID int64, role, content, contentType, model string, tokensUsed int, costUSD float64) (*ChatMessage, error)
	ListMessages(ctx context.Context, conversationID int64) ([]*ChatMessage, error)
	DeleteMessage(ctx context.Context, id int64) error
	UpdateMessageContent(ctx context.Context, id int64, content string, tokensUsed int, costUSD float64) error

	GetAvailableKeys(ctx context.Context, userID int64) ([]*ChatAvailableKey, error)
}

// ChatService handles chat business logic.
type ChatService struct {
	chatRepo   ChatRepository
	apiKeyRepo APIKeyRepository
	groupRepo  GroupRepository
}

// NewChatService creates a new ChatService.
func NewChatService(chatRepo ChatRepository, apiKeyRepo APIKeyRepository, groupRepo GroupRepository) *ChatService {
	return &ChatService{
		chatRepo:   chatRepo,
		apiKeyRepo: apiKeyRepo,
		groupRepo:  groupRepo,
	}
}

// CreateConversation creates a new conversation.
func (s *ChatService) CreateConversation(ctx context.Context, userID, apiKeyID int64, title, model string) (*Conversation, error) {
	if title == "" {
		title = "New Chat"
	}
	return s.chatRepo.CreateConversation(ctx, userID, apiKeyID, title, model)
}

// GetConversation retrieves a conversation with its messages.
func (s *ChatService) GetConversation(ctx context.Context, userID, conversationID int64) (*Conversation, []*ChatMessage, error) {
	conv, err := s.chatRepo.GetConversation(ctx, conversationID)
	if err != nil {
		return nil, nil, ErrConversationNotFound
	}
	if conv.UserID != userID {
		return nil, nil, ErrConversationForbid
	}

	messages, err := s.chatRepo.ListMessages(ctx, conversationID)
	if err != nil {
		return nil, nil, err
	}

	return conv, messages, nil
}

// ListConversations lists user conversations with pagination.
func (s *ChatService) ListConversations(ctx context.Context, userID int64, page, pageSize int) ([]*Conversation, int64, error) {
	return s.chatRepo.ListConversations(ctx, userID, page, pageSize)
}

// UpdateConversation updates a conversation's title or model.
func (s *ChatService) UpdateConversation(ctx context.Context, userID, conversationID int64, title, model *string) (*Conversation, error) {
	conv, err := s.chatRepo.GetConversation(ctx, conversationID)
	if err != nil {
		return nil, ErrConversationNotFound
	}
	if conv.UserID != userID {
		return nil, ErrConversationForbid
	}
	return s.chatRepo.UpdateConversation(ctx, conversationID, title, model)
}

// DeleteConversation soft-deletes a conversation.
func (s *ChatService) DeleteConversation(ctx context.Context, userID, conversationID int64) error {
	conv, err := s.chatRepo.GetConversation(ctx, conversationID)
	if err != nil {
		return ErrConversationNotFound
	}
	if conv.UserID != userID {
		return ErrConversationForbid
	}
	return s.chatRepo.DeleteConversation(ctx, conversationID)
}

// DeleteMessage deletes a message from a conversation.
func (s *ChatService) DeleteMessage(ctx context.Context, userID, conversationID, messageID int64) error {
	conv, err := s.chatRepo.GetConversation(ctx, conversationID)
	if err != nil {
		return ErrConversationNotFound
	}
	if conv.UserID != userID {
		return ErrConversationForbid
	}
	return s.chatRepo.DeleteMessage(ctx, messageID)
}

// GetAvailableKeys returns the user's active API keys with group info.
func (s *ChatService) GetAvailableKeys(ctx context.Context, userID int64) ([]*ChatAvailableKey, error) {
	return s.chatRepo.GetAvailableKeys(ctx, userID)
}

// GetModelsForKey returns available models for a specific API key by querying the gateway.
func (s *ChatService) GetModelsForKey(ctx context.Context, userID int64, keyID int64, gatewayBaseURL string) ([]string, error) {
	keys, err := s.chatRepo.GetAvailableKeys(ctx, userID)
	if err != nil {
		return nil, err
	}

	var targetKey *ChatAvailableKey
	for _, k := range keys {
		if k.ID == keyID {
			targetKey = k
			break
		}
	}
	if targetKey == nil {
		return nil, ErrChatNoAvailableKey
	}

	// Get the actual API key value
	keyObj, err := s.apiKeyRepo.GetByID(ctx, targetKey.ID)
	if err != nil {
		return nil, fmt.Errorf("get api key: %w", err)
	}

	// Call gateway /v1/models to get real model list
	endpoint := gatewayBaseURL + "/v1/models"
	req, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("create models request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+keyObj.Key)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("models request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return nil, fmt.Errorf("models endpoint returned status %d: %s", resp.StatusCode, string(body))
	}

	var modelsResp struct {
		Data []struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&modelsResp); err != nil {
		return nil, fmt.Errorf("decode models response: %w", err)
	}

	models := make([]string, 0, len(modelsResp.Data))
	for _, m := range modelsResp.Data {
		models = append(models, m.ID)
	}
	return models, nil
}

// SSEWriter wraps an http.ResponseWriter for SSE streaming.
type SSEWriter interface {
	io.Writer
	Flush()
}

// SendMessage sends a user message and streams the assistant's response via SSE.
func (s *ChatService) SendMessage(ctx context.Context, userID, conversationID int64, content, model string, w SSEWriter, gatewayBaseURL string) error {
	// Verify ownership
	conv, err := s.chatRepo.GetConversation(ctx, conversationID)
	if err != nil {
		return ErrConversationNotFound
	}
	if conv.UserID != userID {
		return ErrConversationForbid
	}

	// Use conversation's model if not specified
	if model == "" {
		model = conv.Model
	}

	// Save user message
	now := time.Now()
	_, err = s.chatRepo.CreateMessage(ctx, conversationID, "user", content, "text", model, 0, 0)
	if err != nil {
		return fmt.Errorf("save user message: %w", err)
	}

	// Update last_message_at
	_ = s.chatRepo.UpdateConversationLastMessageAt(ctx, conversationID, now)

	// Build conversation history for context
	messages, err := s.chatRepo.ListMessages(ctx, conversationID)
	if err != nil {
		return fmt.Errorf("load conversation history: %w", err)
	}

	// Get the actual API key value
	keyObj, err := s.apiKeyRepo.GetByID(ctx, conv.APIKeyID)
	if err != nil {
		return fmt.Errorf("get api key: %w", err)
	}
	apiKey := keyObj.Key

	// Build OpenAI-compatible messages array
	chatMessages := make([]map[string]string, 0, len(messages))
	for _, msg := range messages {
		chatMessages = append(chatMessages, map[string]string{
			"role":    msg.Role,
			"content": msg.Content,
		})
	}

	// Build request body
	reqBody := map[string]interface{}{
		"model":    model,
		"messages": chatMessages,
		"stream":   true,
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("marshal request: %w", err)
	}

	// Create HTTP request to gateway
	endpoint := gatewayBaseURL + "/v1/chat/completions"
	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return fmt.Errorf("create gateway request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	// Execute request
	client := &http.Client{Timeout: 5 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("gateway request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return fmt.Errorf("gateway returned status %d: %s", resp.StatusCode, string(body))
	}

	// Stream SSE response to client and collect full response
	var fullContent strings.Builder
	scanner := bufio.NewScanner(resp.Body)
	scanner.Buffer(make([]byte, 64*1024), 64*1024)

	for scanner.Scan() {
		line := scanner.Text()

		if !strings.HasPrefix(line, "data: ") {
			continue
		}

		data := strings.TrimPrefix(line, "data: ")
		if data == "[DONE]" {
			fmt.Fprintf(w, "data: [DONE]\n\n")
			w.Flush()
			break
		}

		// Parse the SSE data to extract content delta
		var chunk struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
			} `json:"choices"`
		}
		if err := json.Unmarshal([]byte(data), &chunk); err == nil {
			if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
				fullContent.WriteString(chunk.Choices[0].Delta.Content)
			}
		}

		// Forward the SSE event to the client
		fmt.Fprintf(w, "data: %s\n\n", data)
		w.Flush()
	}

	// Save assistant message
	assistantContent := fullContent.String()
	if assistantContent != "" {
		_, err = s.chatRepo.CreateMessage(ctx, conversationID, "assistant", assistantContent, "text", model, 0, 0)
		if err != nil {
			fmt.Printf("[ChatService] Warning: failed to save assistant message: %v\n", err)
		}
	}

	// Update conversation model
	_, _ = s.chatRepo.UpdateConversation(ctx, conversationID, nil, &model)

	// Auto-generate title for first message
	if conv.Title == "New Chat" && len(messages) <= 2 {
		go s.autoGenerateTitle(context.Background(), conversationID, content, gatewayBaseURL, apiKey, model)
	}

	return nil
}

// autoGenerateTitle generates a conversation title from the first message.
func (s *ChatService) autoGenerateTitle(ctx context.Context, conversationID int64, firstMessage, gatewayBaseURL, apiKey, model string) {
	titlePrompt := []map[string]string{
		{"role": "system", "content": "Generate a short title (max 6 words) for this conversation. Reply with just the title, no quotes or extra text."},
		{"role": "user", "content": firstMessage},
	}

	reqBody := map[string]interface{}{
		"model":      model,
		"messages":   titlePrompt,
		"max_tokens": 30,
		"stream":     false,
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return
	}

	endpoint := gatewayBaseURL + "/v1/chat/completions"
	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return
	}

	if len(result.Choices) > 0 {
		title := strings.TrimSpace(result.Choices[0].Message.Content)
		if len(title) > 200 {
			title = title[:200]
		}
		if title != "" {
			_, _ = s.chatRepo.UpdateConversation(ctx, conversationID, &title, nil)
		}
	}
}

// ImageGenerateRequest holds parameters for image generation.
type ImageGenerateRequest struct {
	Prompt string `json:"prompt"`
	Size   string `json:"size"`   // e.g., "1024x1024", "1024x1536"
	N      int    `json:"n"`      // Number of images (1-4)
}

// ImageGenerateResult holds the result of image generation.
type ImageGenerateResult struct {
	Message   *ChatMessage `json:"message"`
	ImageURLs []string     `json:"image_urls"`
}

// GenerateImage generates images using the gateway's images/generations endpoint.
func (s *ChatService) GenerateImage(ctx context.Context, userID, conversationID int64, req ImageGenerateRequest, gatewayBaseURL string) (*ImageGenerateResult, error) {
	// Verify ownership
	conv, err := s.chatRepo.GetConversation(ctx, conversationID)
	if err != nil {
		return nil, ErrConversationNotFound
	}
	if conv.UserID != userID {
		return nil, ErrConversationForbid
	}

	// Get the actual API key value
	keyObj, err := s.apiKeyRepo.GetByID(ctx, conv.APIKeyID)
	if err != nil {
		return nil, fmt.Errorf("get api key: %w", err)
	}
	apiKey := keyObj.Key

	// Save user message (the prompt)
	now := time.Now()
	_, err = s.chatRepo.CreateMessage(ctx, conversationID, "user", req.Prompt, "text", "gpt-image-1", 0, 0)
	if err != nil {
		return nil, fmt.Errorf("save user message: %w", err)
	}
	_ = s.chatRepo.UpdateConversationLastMessageAt(ctx, conversationID, now)

	// Default parameters
	if req.Size == "" {
		req.Size = "1024x1024"
	}
	if req.N <= 0 || req.N > 4 {
		req.N = 1
	}

	// Build request body
	reqBody := map[string]interface{}{
		"model":           "gpt-image-1",
		"prompt":          req.Prompt,
		"size":            req.Size,
		"n":               req.N,
		"response_format": "b64_json",
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	// Create HTTP request to gateway
	endpoint := gatewayBaseURL + "/v1/images/generations"
	httpReq, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("create gateway request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	// Execute request (images can take a while)
	client := &http.Client{Timeout: 5 * time.Minute}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("gateway request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return nil, fmt.Errorf("gateway returned status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var imageResp struct {
		Data []struct {
			B64JSON string `json:"b64_json"`
			URL     string `json:"url"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&imageResp); err != nil {
		return nil, fmt.Errorf("decode image response: %w", err)
	}

	// Collect image data (URLs or base64)
	imageURLs := make([]string, 0, len(imageResp.Data))
	for _, img := range imageResp.Data {
		if img.B64JSON != "" {
			imageURLs = append(imageURLs, "data:image/png;base64,"+img.B64JSON)
		} else if img.URL != "" {
			imageURLs = append(imageURLs, img.URL)
		}
	}

	// Save assistant message with image_generation content type
	assistantContent := fmt.Sprintf("Generated %d image(s) for: %s", len(imageURLs), req.Prompt)
	msg, err := s.chatRepo.CreateMessage(ctx, conversationID, "assistant", assistantContent, "image_generation", "gpt-image-1", 0, 0)
	if err != nil {
		return nil, fmt.Errorf("save assistant message: %w", err)
	}

	// Update conversation model
	model := "gpt-image-1"
	_, _ = s.chatRepo.UpdateConversation(ctx, conversationID, nil, &model)

	// Auto-generate title for first message
	messages, _ := s.chatRepo.ListMessages(ctx, conversationID)
	if conv.Title == "New Chat" && len(messages) <= 2 {
		go s.autoGenerateTitle(context.Background(), conversationID, req.Prompt, gatewayBaseURL, apiKey, "gpt-4o-mini")
	}

	return &ImageGenerateResult{
		Message:   msg,
		ImageURLs: imageURLs,
	}, nil
}
