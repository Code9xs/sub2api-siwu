/**
 * Chat API Client
 * Handles all HTTP requests for the chat feature
 */

import { apiClient } from './client'

// ==================== Types ====================

export interface Conversation {
  id: number
  user_id: number
  api_key_id: number
  title: string
  model: string
  last_message_at: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: number
  conversation_id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  content_type: string
  image_urls?: string[]
  model?: string
  tokens_used: number
  cost_usd: number
  metadata?: Record<string, unknown>
  created_at: string
}

export interface ChatAttachment {
  name: string
  mime_type: string
  type: 'text' | 'image'
  content?: string
  data_url?: string
}

export interface ChatAvailableKey {
  id: number
  name: string
  group_id: number
  group_name: string
  platform: string
}

export interface ConversationDetail {
  conversation: Conversation
  messages: ChatMessage[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

// ==================== API Functions ====================

/**
 * List conversations with pagination
 */
export async function listConversations(
  page = 1,
  pageSize = 50
): Promise<PaginatedResponse<Conversation>> {
  const { data } = await apiClient.get('/chat/conversations', {
    params: { page, page_size: pageSize }
  })
  return data
}

/**
 * Create a new conversation
 */
export async function createConversation(
  apiKeyId: number,
  model = '',
  title = ''
): Promise<Conversation> {
  const { data } = await apiClient.post('/chat/conversations', {
    api_key_id: apiKeyId,
    model,
    title
  })
  return data
}

/**
 * Get a conversation with its messages
 */
export async function getConversation(id: number): Promise<ConversationDetail> {
  const { data } = await apiClient.get(`/chat/conversations/${id}`)
  return data
}

/**
 * Update a conversation (title or model)
 */
export async function updateConversation(
  id: number,
  updates: { title?: string; model?: string }
): Promise<Conversation> {
  const { data } = await apiClient.put(`/chat/conversations/${id}`, updates)
  return data
}

/**
 * Delete a conversation
 */
export async function deleteConversation(id: number): Promise<void> {
  await apiClient.delete(`/chat/conversations/${id}`)
}

/**
 * Delete a message
 */
export async function deleteMessage(conversationId: number, messageId: number): Promise<void> {
  await apiClient.delete(`/chat/conversations/${conversationId}/messages/${messageId}`)
}

/**
 * Get available API keys for chat
 */
export async function getAvailableKeys(): Promise<ChatAvailableKey[]> {
  const { data } = await apiClient.get('/chat/available-keys')
  return data
}

/**
 * Get available models for a specific API key
 */
export async function getModelsForKey(keyId: number): Promise<string[]> {
  const { data } = await apiClient.get(`/chat/available-keys/${keyId}/models`)
  return data
}

/**
 * Image generation response
 */
export interface ImageGenerateResponse {
  message: ChatMessage
  image_urls: string[]
}

/**
 * Generate images in a conversation
 */
export async function generateImage(
  conversationId: number,
  prompt: string,
  model: string,
  size = '1024x1024',
  n = 1,
  attachments: ChatAttachment[] = []
): Promise<ImageGenerateResponse> {
  const { data } = await apiClient.post(
    `/chat/conversations/${conversationId}/images`,
    { prompt, model, size, n, attachments }
  )
  return data
}
