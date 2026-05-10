/**
 * Chat Store
 * Manages state for the ChatGPT-style chat feature
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as chatApi from '@/api/chat'
import type { Conversation, ChatMessage, ChatAvailableKey, ChatAttachment } from '@/api/chat'
import { useSSE } from '@/composables/useSSE'

function isImageModel(model: string) {
  return model.toLowerCase().startsWith('gpt-image-')
}

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const activeConversationId = ref<number | null>(null)
  const messages = ref<ChatMessage[]>([])
  const availableKeys = ref<ChatAvailableKey[]>([])
  const availableModels = ref<string[]>([])

  const selectedKeyId = ref<number | null>(null)
  const selectedModel = ref<string>('')
  const streamingContent = ref<string>('')
  const conversationsLoading = ref(false)
  const messagesLoading = ref(false)
  const keysLoading = ref(false)

  const totalConversations = ref(0)

  const { isStreaming, abort: abortStream, start: startStream } = useSSE()

  const activeConversation = computed(() =>
    conversations.value.find(c => c.id === activeConversationId.value) || null
  )

  const hasKeys = computed(() => availableKeys.value.length > 0)

  const canSend = computed(() =>
    selectedKeyId.value !== null &&
    selectedModel.value !== '' &&
    !isStreaming.value
  )

  const displayMessages = computed<ChatMessage[]>(() => {
    const msgs = [...messages.value]
    if (isStreaming.value && streamingContent.value) {
      msgs.push({
        id: -1,
        conversation_id: activeConversationId.value || 0,
        role: 'assistant',
        content: streamingContent.value,
        content_type: 'text',
        model: selectedModel.value,
        tokens_used: 0,
        cost_usd: 0,
        created_at: new Date().toISOString()
      })
    }
    return msgs
  })

  async function loadAvailableKeys() {
    keysLoading.value = true
    try {
      availableKeys.value = await chatApi.getAvailableKeys()
      const selectedKeyExists = availableKeys.value.some(key => key.id === selectedKeyId.value)
      if (availableKeys.value.length > 0 && (!selectedKeyId.value || !selectedKeyExists)) {
        await selectKey(availableKeys.value[0].id)
      }
      if (availableKeys.value.length === 0) {
        selectedKeyId.value = null
        selectedModel.value = ''
        availableModels.value = []
      }
    } catch (error) {
      console.error('Failed to load available keys:', error)
    } finally {
      keysLoading.value = false
    }
  }

  async function loadModelsForKey(keyId: number) {
    try {
      availableModels.value = (await chatApi.getModelsForKey(keyId)).filter(model => !isImageModel(model))
      if (availableModels.value.length > 0 && !availableModels.value.includes(selectedModel.value)) {
        selectedModel.value = availableModels.value[0]
      }
    } catch (error) {
      console.error('Failed to load models:', error)
    }
  }

  async function selectKey(keyId: number) {
    selectedKeyId.value = keyId
    selectedModel.value = ''
    await loadModelsForKey(keyId)
  }

  function selectModel(model: string) {
    if (isImageModel(model)) return
    selectedModel.value = model
  }

  async function loadConversations(page = 1, pageSize = 50) {
    conversationsLoading.value = true
    try {
      const result = await chatApi.listConversations(page, pageSize)
      conversations.value = result.items || []
      totalConversations.value = result.total
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      conversationsLoading.value = false
    }
  }

  async function selectConversation(conversationId: number) {
    activeConversationId.value = conversationId
    messagesLoading.value = true
    try {
      const detail = await chatApi.getConversation(conversationId)
      messages.value = detail.messages || []
      if (detail.conversation.api_key_id) {
        selectedKeyId.value = detail.conversation.api_key_id
        await loadModelsForKey(detail.conversation.api_key_id)
      }
      if (detail.conversation.model && !isImageModel(detail.conversation.model)) {
        selectedModel.value = detail.conversation.model
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    } finally {
      messagesLoading.value = false
    }
  }

  async function createConversation(title = ''): Promise<Conversation | null> {
    if (!selectedKeyId.value) return null

    try {
      const conv = await chatApi.createConversation(
        selectedKeyId.value,
        selectedModel.value,
        title
      )
      conversations.value.unshift(conv)
      activeConversationId.value = conv.id
      messages.value = []
      return conv
    } catch (error) {
      console.error('Failed to create conversation:', error)
      return null
    }
  }

  async function updateConversationTitle(conversationId: number, title: string) {
    try {
      const updated = await chatApi.updateConversation(conversationId, { title })
      const index = conversations.value.findIndex(c => c.id === conversationId)
      if (index !== -1) {
        conversations.value[index] = updated
      }
    } catch (error) {
      console.error('Failed to update conversation:', error)
    }
  }

  async function deleteConversation(conversationId: number) {
    try {
      await chatApi.deleteConversation(conversationId)
      conversations.value = conversations.value.filter(c => c.id !== conversationId)
      if (activeConversationId.value === conversationId) {
        activeConversationId.value = null
        messages.value = []
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  async function sendMessage(content: string, attachments: ChatAttachment[] = []) {
    if (!canSend.value || (!content.trim() && attachments.length === 0)) return

    if (!activeConversationId.value) {
      const conv = await createConversation()
      if (!conv) return
    }

    const conversationId = activeConversationId.value!
    const displayContent = buildDisplayContent(content, attachments)

    messages.value.push({
      id: Date.now(),
      conversation_id: conversationId,
      role: 'user',
      content: displayContent,
      content_type: 'text',
      model: selectedModel.value,
      tokens_used: 0,
      cost_usd: 0,
      metadata: attachments.length > 0 ? { attachments: summarizeAttachments(attachments) } : undefined,
      created_at: new Date().toISOString()
    })

    streamingContent.value = ''
    await startStream(
      `/chat/conversations/${conversationId}/messages`,
      {
        content: content.trim(),
        model: selectedModel.value,
        attachments
      },
      {
        onDelta(delta) {
          streamingContent.value += delta
        },
        onDone() {
          if (streamingContent.value) {
            messages.value.push({
              id: Date.now() + 1,
              conversation_id: conversationId,
              role: 'assistant',
              content: streamingContent.value,
              content_type: 'text',
              model: selectedModel.value,
              tokens_used: 0,
              cost_usd: 0,
              created_at: new Date().toISOString()
            })
          }
          streamingContent.value = ''
          loadConversations()
        },
        onError(error) {
          console.error('Stream error:', error)
          streamingContent.value = ''
        }
      }
    )
  }

  function stopStreaming() {
    abortStream()
    if (streamingContent.value) {
      messages.value.push({
        id: Date.now() + 1,
        conversation_id: activeConversationId.value || 0,
        role: 'assistant',
        content: streamingContent.value,
        content_type: 'text',
        model: selectedModel.value,
        tokens_used: 0,
        cost_usd: 0,
        created_at: new Date().toISOString()
      })
    }
    streamingContent.value = ''
  }

  function summarizeAttachments(attachments: ChatAttachment[]) {
    return attachments.map(attachment => ({
      name: attachment.name,
      mime_type: attachment.mime_type,
      type: attachment.type
    }))
  }

  function buildDisplayContent(content: string, attachments: ChatAttachment[]) {
    if (attachments.length === 0) return content.trim()
    const names = attachments.map(attachment => `- ${attachment.name}`).join('\n')
    const prompt = content.trim()
    return prompt ? `${prompt}\n\nAttachments:\n${names}` : `Attachments:\n${names}`
  }

  function newChat() {
    activeConversationId.value = null
    messages.value = []
    streamingContent.value = ''
  }

  async function deleteMessage(conversationId: number, messageId: number) {
    try {
      await chatApi.deleteMessage(conversationId, messageId)
      messages.value = messages.value.filter(m => m.id !== messageId)
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  return {
    conversations,
    activeConversationId,
    messages,
    availableKeys,
    availableModels,
    selectedKeyId,
    selectedModel,
    streamingContent,
    isStreaming,
    conversationsLoading,
    messagesLoading,
    keysLoading,
    totalConversations,
    activeConversation,
    hasKeys,
    canSend,
    displayMessages,
    loadAvailableKeys,
    loadModelsForKey,
    selectKey,
    selectModel,
    loadConversations,
    selectConversation,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    sendMessage,
    stopStreaming,
    newChat,
    deleteMessage
  }
})
