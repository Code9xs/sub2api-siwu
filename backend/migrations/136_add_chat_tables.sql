-- 136_add_chat_tables.sql
-- Create conversations and messages tables for ChatGPT-style chat feature

CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    api_key_id BIGINT NOT NULL REFERENCES api_keys(id),
    title VARCHAR(200) NOT NULL DEFAULT 'New Chat',
    model VARCHAR(100) NOT NULL DEFAULT '',
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Index for listing conversations by user, ordered by last_message_at
CREATE INDEX IF NOT EXISTS idx_conversations_user_deleted_last_msg
    ON conversations (user_id, deleted_at, last_message_at DESC);

-- Index for api_key_id lookups
CREATE INDEX IF NOT EXISTS idx_conversations_api_key_id
    ON conversations (api_key_id);

CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL DEFAULT '',
    content_type VARCHAR(20) NOT NULL DEFAULT 'text',
    image_urls JSONB,
    model VARCHAR(100),
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost_usd DECIMAL(20,8) NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for listing messages within a conversation, ordered by created_at
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
    ON messages (conversation_id, created_at);
