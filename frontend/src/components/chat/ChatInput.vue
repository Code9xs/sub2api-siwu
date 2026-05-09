<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
import { useChatStore } from '@/stores/chat'
import type { ChatAttachment } from '@/api/chat'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const chatStore = useChatStore()
const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const showModelDropdown = ref(false)
const showKeyDropdown = ref(false)
const modelButtonRef = ref<HTMLButtonElement | null>(null)
const keyButtonRef = ref<HTMLButtonElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})
const keyDropdownStyle = ref<Record<string, string>>({})
const attachments = ref<ChatAttachment[]>([])
const attachmentError = ref('')

const canSend = computed(() =>
  (inputText.value.trim() !== '' || attachments.value.length > 0) && chatStore.canSend
)

const isBusy = computed(() => chatStore.isStreaming)

const currentModelLabel = computed(() => {
  if (!chatStore.selectedModel) return t('chat.selectModel')
  return chatStore.selectedModel
})

const currentKeyLabel = computed(() => {
  const key = chatStore.availableKeys.find(item => item.id === chatStore.selectedKeyId)
  return key?.name || 'API Key'
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
  const outgoingAttachments = attachments.value.map(item => ({ ...item }))
  inputText.value = ''
  attachments.value = []
  attachmentError.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }

  await chatStore.sendMessage(content, outgoingAttachments)
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

async function selectKey(keyId: number) {
  showKeyDropdown.value = false
  await chatStore.selectKey(keyId)
}

function updateDropdownPosition(button: HTMLButtonElement | null, target: typeof dropdownStyle) {
  if (!button) return
  const rect = button.getBoundingClientRect()
  const width = Math.max(rect.width, 260)
  const left = Math.min(rect.left, window.innerWidth - width - 12)
  target.value = {
    position: 'fixed',
    left: `${Math.max(12, left)}px`,
    bottom: `${window.innerHeight - rect.top + 8}px`,
    width: `${width}px`
  }
}

async function toggleModelDropdown() {
  if (isBusy.value) return
  showKeyDropdown.value = false
  showModelDropdown.value = !showModelDropdown.value
  if (showModelDropdown.value) {
    await nextTick()
    updateDropdownPosition(modelButtonRef.value, dropdownStyle)
  }
}

async function toggleKeyDropdown() {
  if (isBusy.value) return
  showModelDropdown.value = false
  showKeyDropdown.value = !showKeyDropdown.value
  if (showKeyDropdown.value) {
    await nextTick()
    updateDropdownPosition(keyButtonRef.value, keyDropdownStyle)
  }
}

function closeDropdowns(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.chat-floating-dropdown') && !target.closest('.selector-btn')) {
    showModelDropdown.value = false
    showKeyDropdown.value = false
  }
}

function handleWindowChange() {
  showModelDropdown.value = false
  showKeyDropdown.value = false
}

if (typeof window !== 'undefined') {
  window.addEventListener('click', closeDropdowns)
  window.addEventListener('resize', handleWindowChange)
  window.addEventListener('scroll', handleWindowChange, true)
}

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('click', closeDropdowns)
  window.removeEventListener('resize', handleWindowChange)
  window.removeEventListener('scroll', handleWindowChange, true)
})

function openFilePicker() {
  if (isBusy.value) return
  fileInputRef.value?.click()
}

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  attachmentError.value = ''
  for (const file of files) {
    try {
      attachments.value.push(await readAttachment(file))
    } catch (error) {
      attachmentError.value = error instanceof Error ? error.message : String(error)
    }
  }
  input.value = ''
}

function removeAttachment(index: number) {
  attachments.value.splice(index, 1)
}

async function readAttachment(file: File): Promise<ChatAttachment> {
  const maxSize = 8 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error(`${file.name} is larger than 8MB`)
  }

  if (file.type.startsWith('image/')) {
    return {
      name: file.name,
      mime_type: file.type,
      type: 'image',
      data_url: await readAsDataURL(file)
    }
  }

  const lowerName = file.name.toLowerCase()
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
    const XLSX = await import('xlsx')
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const sheets = workbook.SheetNames.map(name => {
      const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name])
      return `# Sheet: ${name}\n${csv}`
    })
    return {
      name: file.name,
      mime_type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      type: 'text',
      content: sheets.join('\n\n')
    }
  }

  const textLike = file.type.startsWith('text/') ||
    ['.txt', '.md', '.csv', '.json', '.xml', '.yaml', '.yml', '.log', '.ts', '.js', '.vue', '.go', '.py', '.java', '.sql'].some(ext => lowerName.endsWith(ext))
  if (textLike) {
    return {
      name: file.name,
      mime_type: file.type || 'text/plain',
      type: 'text',
      content: await file.text()
    }
  }

  throw new Error(`${file.name} is not supported yet`)
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
    reader.readAsDataURL(file)
  })
}
</script>

<template>
  <div class="composer-container">
    <div class="composer-wrapper">
      <div class="composer">
        <div v-if="attachments.length > 0" class="attachment-list">
          <div v-for="(attachment, index) in attachments" :key="`${attachment.name}-${index}`" class="attachment-chip">
            <span class="attachment-icon">{{ attachment.type === 'image' ? 'IMG' : 'TXT' }}</span>
            <span class="attachment-name" :title="attachment.name">{{ attachment.name }}</span>
            <button class="attachment-remove" type="button" @click="removeAttachment(index)" :disabled="isBusy">×</button>
          </div>
        </div>

        <textarea
          ref="textareaRef"
          v-model="inputText"
          :placeholder="t('chat.inputPlaceholder')"
          :disabled="isBusy"
          rows="1"
          @keydown="handleKeydown"
          @input="autoResize"
          class="composer-textarea"
        ></textarea>

        <div class="composer-toolbar">
          <div class="toolbar-left">
            <button
              class="tool-btn"
              type="button"
              @click="openFilePicker"
              :disabled="isBusy"
              title="Upload attachment"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input
              ref="fileInputRef"
              type="file"
              multiple
              class="file-input"
              accept="image/*,.txt,.md,.csv,.json,.xml,.yaml,.yml,.log,.ts,.js,.vue,.go,.py,.java,.sql,.xlsx,.xls"
              @change="handleFileChange"
            />

            <div class="selector-group" v-if="chatStore.availableModels.length > 0">
              <button
                ref="modelButtonRef"
                class="selector-btn model-btn"
                type="button"
                @click.stop="toggleModelDropdown"
                :disabled="isBusy"
              >
                <span class="selector-label">{{ currentModelLabel }}</span>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>

            <div class="selector-group" v-if="chatStore.availableKeys.length > 1">
              <button
                ref="keyButtonRef"
                class="selector-btn key-btn"
                type="button"
                @click.stop="toggleKeyDropdown"
                :disabled="isBusy"
              >
                <span class="selector-label">{{ currentKeyLabel }}</span>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
          </div>

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

      <p v-if="attachmentError" class="attachment-error">{{ attachmentError }}</p>
      <p class="composer-hint">{{ t('chat.inputHint') }}</p>
    </div>

    <Teleport to="body">
      <div v-if="showModelDropdown" class="chat-floating-dropdown" :style="dropdownStyle" @click.stop>
        <button
          v-for="model in chatStore.availableModels"
          :key="model"
          type="button"
          class="dropdown-option"
          :class="{ active: model === chatStore.selectedModel }"
          @click="selectModel(model)"
        >
          <span>{{ model }}</span>
        </button>
      </div>

      <div v-if="showKeyDropdown" class="chat-floating-dropdown key-dropdown" :style="keyDropdownStyle" @click.stop>
        <button
          v-for="key in chatStore.availableKeys"
          :key="key.id"
          type="button"
          class="dropdown-option key-option"
          :class="{ active: key.id === chatStore.selectedKeyId }"
          @click="selectKey(key.id)"
        >
          <span class="key-name">{{ key.name }}</span>
          <span class="key-meta">{{ key.group_name || key.platform }}</span>
        </button>
      </div>
    </Teleport>
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
}

.composer:focus-within {
  border-color: var(--color-border-focus, #d1d5db);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 12px 0;
}

.attachment-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 220px;
  padding: 5px 8px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 999px;
  background: var(--color-bg-secondary, #f9fafb);
  color: var(--color-text-secondary, #6b7280);
  font-size: 12px;
}

.attachment-icon {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-primary, #6366f1);
}

.attachment-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-remove {
  border: none;
  background: transparent;
  color: var(--color-text-tertiary, #9ca3af);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0 2px;
}

.attachment-remove:hover:not(:disabled) {
  color: var(--color-danger, #ef4444);
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
  gap: 10px;
  padding: 8px 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.file-input {
  display: none;
}

.tool-btn,
.selector-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  background: var(--color-bg-secondary, #f9fafb);
  color: var(--color-text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-btn {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
}

.selector-btn {
  gap: 4px;
  min-width: 0;
  max-width: 210px;
  padding: 5px 10px;
  font-size: 13px;
}

.selector-btn:hover:not(:disabled),
.tool-btn:hover:not(:disabled) {
  border-color: var(--color-text-tertiary, #9ca3af);
  color: var(--color-text-primary, #1f2937);
}

.selector-btn:disabled,
.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selector-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-floating-dropdown {
  max-height: min(320px, 50vh);
  overflow-y: auto;
  background: var(--color-bg-primary, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
  z-index: 9999;
  padding: 6px;
}

.dropdown-option {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  padding: 9px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-primary, #1f2937);
  cursor: pointer;
  font-size: 13px;
  text-align: left;
  transition: background 0.1s ease;
}

.dropdown-option:hover {
  background: var(--color-bg-hover, rgba(0, 0, 0, 0.04));
}

.dropdown-option.active {
  background: var(--color-primary-bg, rgba(99, 102, 241, 0.08));
  color: var(--color-primary, #6366f1);
  font-weight: 500;
}

.key-option {
  align-items: flex-start;
  flex-direction: column;
  gap: 2px;
}

.key-name,
.key-meta {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.key-meta {
  color: var(--color-text-tertiary, #9ca3af);
  font-size: 12px;
  font-weight: 400;
}

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

.composer-hint,
.attachment-error {
  font-size: 11px;
  text-align: center;
  margin: 6px 0 0;
}

.composer-hint {
  color: var(--color-text-tertiary, #9ca3af);
}

.attachment-error {
  color: var(--color-danger, #ef4444);
}

@media (max-width: 768px) {
  .composer-container {
    padding: 0 12px 12px;
  }

  .selector-btn {
    max-width: 140px;
  }

  .key-btn {
    max-width: 110px;
  }
}
</style>
