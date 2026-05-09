<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const chatStore = useChatStore()
const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const showModelDropdown = ref(false)

const canSend = computed(() =>
  inputText.value.trim() !== '' && chatStore.canSend
)

const isBusy = computed(() =>
  chatStore.isStreaming || chatStore.isGeneratingImage
)

const currentModelLabel = computed(() => {
  if (!chatStore.selectedModel) return t('chat.selectModel')
  return chatStore.selectedModel
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

async function send() {
  if (!canSend.value) return
  const content = inputText.value.trim()
  inputText.value = ''
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }

  if (chatStore.isImageModel) {
    await chatStore.generateImageMessage(content)
  } else {
    await chatStore.sendMessage(content)
  }
}

function autoResize(e: Event) {
  const textarea = e.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
}

function selectModel(model: string) {
  chatStore.selectModel(model)
  showModelDropdown.value = false
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.model-selector')) {
    showModelDropdown.value = false
  }
}
</script>

<template>
  <div class="composer-container" @click.capture="handleClickOutside">
    <div class="composer-wrapper">
      <div class="composer" :class="{ focused: false, 'image-mode': chatStore.isImageModel }">
        <!-- Textarea -->
        <textarea
          ref="textareaRef"
          v-model="inputText"
          :placeholder="chatStore.isImageModel ? t('chat.imagePlaceholder') : t('chat.inputPlaceholder')"
          :disabled="isBusy"
          rows="1"
          @keydown="handleKeydown"
          @input="autoResize"
          class="composer-textarea"
        ></textarea>

        <!-- Bottom toolbar -->
        <div class="composer-toolbar">
          <!-- Left: Model selector + Key selector -->
          <div class="toolbar-left">
            <!-- Model selector -->
            <div class="model-selector" v-if="chatStore.availableModels.length > 0">
              <button
                class="model-btn"
                @click.stop="showModelDropdown = !showModelDropdown"
                :disabled="isBusy"
              >
                <span class="model-label">{{ currentModelLabel }}</span>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              <!-- Dropdown -->
              <div class="model-dropdown" v-show="showModelDropdown">
                <div
                  v-for="model in chatStore.availableModels"
                  :key="model"
                  class="model-option"
                  :class="{ active: model === chatStore.selectedModel }"
                  @click="selectModel(model)"
                >
                  {{ model }}
                </div>
              </div>
            </div>

            <!-- Key selector (compact) -->
            <select
              v-if="chatStore.availableKeys.length > 1"
              :value="chatStore.selectedKeyId || ''"
              @change="chatStore.selectKey(Number(($event.target as HTMLSelectElement).value))"
              class="key-select"
              :disabled="isBusy"
            >
              <option v-for="key in chatStore.availableKeys" :key="key.id" :value="key.id">
                {{ key.name }}
              </option>
            </select>
          </div>

          <!-- Right: Send/Stop button -->
          <div class="toolbar-right">
            <button
              v-if="chatStore.isStreaming"
              class="action-btn stop-btn"
              @click="chatStore.stopStreaming()"
              :title="t('chat.stopGenerating')"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
            <button
              v-else-if="chatStore.isGeneratingImage"
              class="action-btn generating-btn"
              disabled
            >
              <span class="spinner"></span>
            </button>
            <button
              v-else
              class="action-btn send-btn"
              :disabled="!canSend"
              @click="send"
              :title="t('chat.send')"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <p class="composer-hint">{{ t('chat.inputHint') }}</p>
    </div>
  </div>
</template>

<style scoped>
.composer-container {
  padding: 0 16px 16px;
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
}

.composer-wrapper {
  width: 100%;
}

.composer {
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 16px;
  background: var(--color-bg-primary, #ffffff);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
}

.composer:focus-within {
  border-color: var(--color-border-focus, #d1d5db);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.composer.image-mode:focus-within {
  border-color: #a855f7;
}

.composer-textarea {
  display: block;
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 14px 16px 4px;
  font-size: 15px;
  line-height: 1.5;
  color: var(--color-text-primary, #1f2937);
  background: transparent;
  min-height: 24px;
  max-height: 200px;
  font-family: inherit;
}

.composer-textarea::placeholder {
  color: var(--color-text-tertiary, #9ca3af);
}

.composer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

/* Model selector */
.model-selector {
  position: relative;
}

.model-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  background: var(--color-bg-secondary, #f9fafb);
  color: var(--color-text-secondary, #6b7280);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  max-width: 180px;
}

.model-btn:hover:not(:disabled) {
  border-color: var(--color-text-tertiary, #9ca3af);
  color: var(--color-text-primary, #1f2937);
}

.model-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.model-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-dropdown {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  min-width: 200px;
  max-height: 280px;
  overflow-y: auto;
  background: var(--color-bg-primary, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  z-index: 50;
  padding: 4px;
}

.model-option {
  padding: 8px 12px;
  font-size: 13px;
  color: var(--color-text-primary, #1f2937);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.1s ease;
}

.model-option:hover {
  background: var(--color-bg-hover, rgba(0, 0, 0, 0.04));
}

.model-option.active {
  background: var(--color-primary-bg, rgba(99, 102, 241, 0.08));
  color: var(--color-primary, #6366f1);
  font-weight: 500;
}

/* Key selector */
.key-select {
  padding: 4px 24px 4px 8px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  background: var(--color-bg-secondary, #f9fafb);
  color: var(--color-text-secondary, #6b7280);
  font-size: 13px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M3 4.5L6 8l3-3.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 6px center;
  max-width: 140px;
}

.key-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Action buttons */
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s ease;
}

.send-btn {
  background: var(--color-text-primary, #1f2937);
  color: white;
}

.send-btn:disabled {
  background: var(--color-bg-disabled, #e5e7eb);
  color: var(--color-text-disabled, #9ca3af);
  cursor: not-allowed;
}

.send-btn:not(:disabled):hover {
  background: var(--color-text-secondary, #374151);
}

.stop-btn {
  background: var(--color-text-primary, #1f2937);
  color: white;
}

.stop-btn:hover {
  opacity: 0.8;
}

.generating-btn {
  background: var(--color-bg-secondary, #f3f4f6);
  cursor: wait;
}

.spinner {
  display: block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border, #e5e7eb);
  border-top-color: var(--color-text-secondary, #6b7280);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.composer-hint {
  font-size: 11px;
  color: var(--color-text-tertiary, #9ca3af);
  text-align: center;
  margin: 6px 0 0;
}

@media (max-width: 768px) {
  .composer-container {
    padding: 0 12px 12px;
  }

  .model-btn {
    max-width: 140px;
  }
}
</style>
