<script setup lang="ts">
/**
 * ChatNoKeyPrompt - Shown when user has no API keys
 * Guides user to create one before using chat
 */
import { useRouter } from 'vue-router'

const router = useRouter()

function goToKeys() {
  router.push({ path: '/keys', query: { create: '1' } })
}
</script>

<template>
  <div class="no-key-prompt">
    <div class="prompt-icon">
      <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
      </svg>
    </div>
    <h2 class="prompt-title">{{ $t('chat.noKeyTitle') }}</h2>
    <p class="prompt-description">{{ $t('chat.noKeyDescription') }}</p>
    <button class="create-key-btn" @click="goToKeys">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14" />
      </svg>
      {{ $t('chat.createKey') }}
    </button>
  </div>
</template>

<style scoped>
.no-key-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 48px 24px;
  text-align: center;
}

.prompt-icon {
  color: var(--color-text-tertiary, #9ca3af);
  margin-bottom: 20px;
  opacity: 0.5;
}

.prompt-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
  margin: 0 0 12px;
}

.prompt-description {
  font-size: 15px;
  color: var(--color-text-secondary, #6b7280);
  max-width: 440px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.create-key-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  background: var(--color-primary, #6366f1);
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.create-key-btn:hover {
  background: var(--color-primary-hover, #4f46e5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
</style>
