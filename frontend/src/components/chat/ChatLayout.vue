<script setup lang="ts">
import { ref, computed } from 'vue'
import ConversationList from './ConversationList.vue'
import ChatMessages from './ChatMessages.vue'
import ChatInput from './ChatInput.vue'
import ChatEmptyState from './ChatEmptyState.vue'
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()
const sidebarOpen = ref(true)

const hasMessages = computed(() =>
  chatStore.activeConversationId !== null || chatStore.displayMessages.length > 0
)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebarOnMobile() {
  if (window.innerWidth <= 768) {
    sidebarOpen.value = false
  }
}
</script>

<template>
  <div class="chat-layout">
    <!-- Sidebar -->
    <aside class="chat-sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <button class="sidebar-toggle-btn" @click="toggleSidebar" :title="$t('chat.collapseSidebar')">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <button class="new-chat-btn" @click="chatStore.newChat()" :title="$t('chat.newChat')">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      <ConversationList @select="closeSidebarOnMobile" />
    </aside>

    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>

    <!-- Main chat area -->
    <main class="chat-main">
      <!-- Header with sidebar toggle (when sidebar is closed) -->
      <div class="chat-header" v-if="!sidebarOpen">
        <button class="header-toggle-btn" @click="toggleSidebar">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <button class="header-new-chat-btn" @click="chatStore.newChat()">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <!-- Chat content -->
      <div class="chat-body" :class="{ 'has-messages': hasMessages }">
        <template v-if="hasMessages">
          <ChatMessages />
          <ChatInput />
        </template>
        <template v-else>
          <ChatEmptyState />
          <ChatInput />
        </template>
      </div>
    </main>
  </div>
</template>

<style scoped>
.chat-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* Sidebar */
.chat-sidebar {
  width: 260px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-sidebar, #f9fafb);
  border-right: 1px solid var(--color-border, #e5e7eb);
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.chat-sidebar:not(.open) {
  width: 0;
  min-width: 0;
  overflow: hidden;
  border-right: none;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  height: 52px;
}

.sidebar-toggle-btn,
.new-chat-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary, #6b7280);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.sidebar-toggle-btn:hover,
.new-chat-btn:hover {
  background: var(--color-bg-hover, rgba(0, 0, 0, 0.05));
  color: var(--color-text-primary, #1f2937);
}

/* Mobile overlay */
.sidebar-overlay {
  display: none;
}

/* Main area */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--color-bg-primary, #ffffff);
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  height: 52px;
}

.header-toggle-btn,
.header-new-chat-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary, #6b7280);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.header-toggle-btn:hover,
.header-new-chat-btn:hover {
  background: var(--color-bg-hover, rgba(0, 0, 0, 0.05));
  color: var(--color-text-primary, #1f2937);
}

.chat-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-body:not(.has-messages) {
  justify-content: center;
}

@media (max-width: 768px) {
  .chat-sidebar {
    position: absolute;
    z-index: 40;
    height: 100%;
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.1);
  }

  .chat-sidebar:not(.open) {
    transform: translateX(-100%);
  }

  .sidebar-overlay {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 30;
    background: rgba(0, 0, 0, 0.4);
  }
}
</style>
