<script setup lang="ts">
import { useChatStore } from '@/stores/chat'
import ConversationItem from './ConversationItem.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const chatStore = useChatStore()

const emit = defineEmits<{
  select: []
}>()

function handleSelect(id: number) {
  chatStore.selectConversation(id)
  emit('select')
}
</script>

<template>
  <div class="conversation-list">
    <div v-if="chatStore.conversationsLoading" class="loading-state">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
    <div v-else-if="chatStore.conversations.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
      <p class="empty-text">{{ t('chat.noConversations') }}</p>
    </div>
    <div v-else class="list-content">
      <ConversationItem
        v-for="conv in chatStore.conversations"
        :key="conv.id"
        :conversation="conv"
        :active="conv.id === chatStore.activeConversationId"
        @select="handleSelect(conv.id)"
        @delete="chatStore.deleteConversation(conv.id)"
        @rename="chatStore.updateConversationTitle(conv.id, $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.loading-dots {
  display: flex;
  gap: 6px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  background: var(--color-text-tertiary, #9ca3af);
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) { animation-delay: 0.16s; }
.loading-dots span:nth-child(3) { animation-delay: 0.32s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 16px;
  text-align: center;
}

.empty-icon {
  color: var(--color-text-tertiary, #9ca3af);
  opacity: 0.5;
  margin-bottom: 12px;
}

.empty-text {
  color: var(--color-text-tertiary, #9ca3af);
  font-size: 13px;
  margin: 0;
}

.list-content {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
</style>
