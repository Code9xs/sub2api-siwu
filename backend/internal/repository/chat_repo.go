package repository

import (
	"context"
	"time"

	"github.com/Wei-Shaw/sub2api/ent"
	"github.com/Wei-Shaw/sub2api/ent/apikey"
	"github.com/Wei-Shaw/sub2api/ent/conversation"
	"github.com/Wei-Shaw/sub2api/ent/message"
	"github.com/Wei-Shaw/sub2api/internal/service"
)

// ChatRepository implements service.ChatRepository using Ent ORM.
type ChatRepository struct {
	client *ent.Client
}

// NewChatRepository creates a new ChatRepository.
func NewChatRepository(client *ent.Client) service.ChatRepository {
	return &ChatRepository{client: client}
}

func (r *ChatRepository) CreateConversation(ctx context.Context, userID, apiKeyID int64, title, model string) (*service.Conversation, error) {
	conv, err := r.client.Conversation.
		Create().
		SetUserID(userID).
		SetAPIKeyID(apiKeyID).
		SetTitle(title).
		SetModel(model).
		Save(ctx)
	if err != nil {
		return nil, err
	}
	return r.entConversationToService(conv), nil
}

func (r *ChatRepository) GetConversation(ctx context.Context, id int64) (*service.Conversation, error) {
	conv, err := r.client.Conversation.Get(ctx, id)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, service.ErrConversationNotFound
		}
		return nil, err
	}
	return r.entConversationToService(conv), nil
}

func (r *ChatRepository) ListConversations(ctx context.Context, userID int64, page, pageSize int) ([]*service.Conversation, int64, error) {
	query := r.client.Conversation.
		Query().
		Where(conversation.UserID(userID)).
		Order(ent.Desc(conversation.FieldLastMessageAt), ent.Desc(conversation.FieldCreatedAt))

	total, err := query.Count(ctx)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	convs, err := query.
		Offset(offset).
		Limit(pageSize).
		All(ctx)
	if err != nil {
		return nil, 0, err
	}

	result := make([]*service.Conversation, 0, len(convs))
	for _, c := range convs {
		result = append(result, r.entConversationToService(c))
	}
	return result, int64(total), nil
}

func (r *ChatRepository) UpdateConversation(ctx context.Context, id int64, title, model *string) (*service.Conversation, error) {
	update := r.client.Conversation.UpdateOneID(id)
	if title != nil {
		update.SetTitle(*title)
	}
	if model != nil {
		update.SetModel(*model)
	}
	conv, err := update.Save(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, service.ErrConversationNotFound
		}
		return nil, err
	}
	return r.entConversationToService(conv), nil
}

func (r *ChatRepository) DeleteConversation(ctx context.Context, id int64) error {
	err := r.client.Conversation.DeleteOneID(id).Exec(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return service.ErrConversationNotFound
		}
		return err
	}
	return nil
}

func (r *ChatRepository) UpdateConversationLastMessageAt(ctx context.Context, id int64, t time.Time) error {
	return r.client.Conversation.
		UpdateOneID(id).
		SetLastMessageAt(t).
		Exec(ctx)
}

func (r *ChatRepository) CreateMessage(ctx context.Context, conversationID int64, role, content, contentType, model string, tokensUsed int, costUSD float64) (*service.ChatMessage, error) {
	builder := r.client.Message.
		Create().
		SetConversationID(conversationID).
		SetRole(message.Role(role)).
		SetContent(content).
		SetContentType(contentType).
		SetTokensUsed(tokensUsed).
		SetCostUsd(costUSD)
	if model != "" {
		builder.SetModel(model)
	}
	msg, err := builder.Save(ctx)
	if err != nil {
		return nil, err
	}
	return r.entMessageToService(msg), nil
}

func (r *ChatRepository) ListMessages(ctx context.Context, conversationID int64) ([]*service.ChatMessage, error) {
	msgs, err := r.client.Message.
		Query().
		Where(message.ConversationID(conversationID)).
		Order(ent.Asc(message.FieldCreatedAt)).
		All(ctx)
	if err != nil {
		return nil, err
	}
	result := make([]*service.ChatMessage, 0, len(msgs))
	for _, m := range msgs {
		result = append(result, r.entMessageToService(m))
	}
	return result, nil
}

func (r *ChatRepository) DeleteMessage(ctx context.Context, id int64) error {
	err := r.client.Message.DeleteOneID(id).Exec(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return service.ErrConversationNotFound
		}
		return err
	}
	return nil
}

func (r *ChatRepository) UpdateMessageContent(ctx context.Context, id int64, content string, tokensUsed int, costUSD float64) error {
	return r.client.Message.
		UpdateOneID(id).
		SetContent(content).
		SetTokensUsed(tokensUsed).
		SetCostUsd(costUSD).
		Exec(ctx)
}

func (r *ChatRepository) GetAvailableKeys(ctx context.Context, userID int64) ([]*service.ChatAvailableKey, error) {
	keys, err := r.client.APIKey.
		Query().
		Where(
			apikey.UserID(userID),
			apikey.Status("active"),
		).
		WithGroup().
		All(ctx)
	if err != nil {
		return nil, err
	}
	result := make([]*service.ChatAvailableKey, 0, len(keys))
	for _, k := range keys {
		ak := &service.ChatAvailableKey{
			ID:   int64(k.ID),
			Name: k.Name,
		}
		if k.Edges.Group != nil {
			ak.GroupID = int64(k.Edges.Group.ID)
			ak.GroupName = k.Edges.Group.Name
			ak.Platform = k.Edges.Group.Platform
		}
		result = append(result, ak)
	}
	return result, nil
}

func (r *ChatRepository) entConversationToService(c *ent.Conversation) *service.Conversation {
	return &service.Conversation{
		ID:            int64(c.ID),
		UserID:        c.UserID,
		APIKeyID:      c.APIKeyID,
		Title:         c.Title,
		Model:         c.Model,
		LastMessageAt: c.LastMessageAt,
		CreatedAt:     c.CreatedAt,
		UpdatedAt:     c.UpdatedAt,
	}
}

func (r *ChatRepository) entMessageToService(m *ent.Message) *service.ChatMessage {
	msg := &service.ChatMessage{
		ID:             int64(m.ID),
		ConversationID: m.ConversationID,
		Role:           string(m.Role),
		Content:        m.Content,
		ContentType:    m.ContentType,
		ImageURLs:      m.ImageUrls,
		TokensUsed:     m.TokensUsed,
		CostUSD:        m.CostUsd,
		Metadata:       m.Metadata,
		CreatedAt:      m.CreatedAt,
	}
	if m.Model != nil {
		msg.Model = *m.Model
	}
	return msg
}
