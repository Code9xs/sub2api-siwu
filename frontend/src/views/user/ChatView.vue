<script setup lang="ts">
import { onMounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import AppLayout from '@/components/layout/AppLayout.vue'
import ChatLayout from '@/components/chat/ChatLayout.vue'
import ChatNoKeyPrompt from '@/components/chat/ChatNoKeyPrompt.vue'

const chatStore = useChatStore()

onMounted(async () => {
  await chatStore.loadAvailableKeys()
  if (chatStore.hasKeys) {
    await chatStore.loadConversations()
  }
})
</script>

<template>
  <AppLayout :noPadding="true">
    <div class="chat-view">
      <ChatLayout v-if="chatStore.hasKeys || chatStore.keysLoading" />
      <ChatNoKeyPrompt v-else />
    </div>
  </AppLayout>
</template>

<style scoped>
.chat-view {
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (max-width: 768px) {
  .chat-view {
    height: calc(100vh - 56px);
  }
}
</style>
