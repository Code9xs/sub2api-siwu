<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import ChatMessage from './ChatMessage.vue'

const chatStore = useChatStore()
const messagesContainer = ref<HTMLElement | null>(null)

watch(
  () => [chatStore.displayMessages.length, chatStore.streamingContent],
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}
</script>

<template>
  <div class="messages-scroll" ref="messagesContainer">
    <div v-if="chatStore.messagesLoading" class="loading-state">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
    <div v-else class="messages-container">
      <ChatMessage
        v-for="msg in chatStore.displayMessages"
        :key="msg.id"
        :message="msg"
        :is-streaming="msg.id === -1"
      />
    </div>
  </div>
</template>

<style scoped>
.messages-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.loading-dots {
  display: flex;
  gap: 6px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
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

.messages-container {
  max-width: 768px;
  margin: 0 auto;
  padding: 24px 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 768px) {
  .messages-container {
    padding: 16px 16px 12px;
  }
}
</style>
