<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import type { ChatMessage } from '@/api/chat'
import { renderMarkdown } from '@/composables/useMarkdown'
import ChatImageDisplay from './ChatImageDisplay.vue'

const props = defineProps<{
  message: ChatMessage
  isStreaming?: boolean
}>()

const showCopy = ref(false)
const copied = ref(false)
const codeCopied = ref(false)
let codeCopiedTimer: number | null = null

const renderedContent = computed(() => {
  if (!props.message.content) return ''
  return renderMarkdown(props.message.content)
})

const hasImages = computed(() =>
  props.message.content_type === 'image_generation' &&
  props.message.image_urls &&
  props.message.image_urls.length > 0
)

const isUser = computed(() => props.message.role === 'user')

const attachments = computed(() => {
  const raw = props.message.metadata?.attachments
  return Array.isArray(raw) ? raw as Array<{ name?: string; type?: string; mime_type?: string }> : []
})

async function copyContent() {
  if (!props.message.content) return
  try {
    await copyText(props.message.content)
    copied.value = true
    window.setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // fallback
  }
}

async function handleMarkdownClick(event: MouseEvent) {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.code-copy-btn')
  if (!button) return

  const code = button.dataset.code
  if (!code) return

  await copyText(decodeURIComponent(code))
  button.classList.add('copied')
  const label = button.querySelector('span')
  if (label) label.textContent = '已复制'
  codeCopied.value = true

  if (codeCopiedTimer !== null) {
    window.clearTimeout(codeCopiedTimer)
  }
  codeCopiedTimer = window.setTimeout(() => {
    button.classList.remove('copied')
    if (label) label.textContent = '复制'
    codeCopied.value = false
    codeCopiedTimer = null
  }, 1800)
}

onBeforeUnmount(() => {
  if (codeCopiedTimer !== null) {
    window.clearTimeout(codeCopiedTimer)
  }
})

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}
</script>

<template>
  <div
    class="message-row"
    :class="{ 'user-row': isUser, 'assistant-row': !isUser }"
    @mouseenter="showCopy = true"
    @mouseleave="showCopy = false"
  >
    <!-- User message: right-aligned bubble -->
    <div v-if="isUser" class="user-bubble">
      <span class="user-text">{{ message.content }}</span>
      <div v-if="attachments.length > 0" class="message-attachments">
        <span v-for="(attachment, index) in attachments" :key="`${attachment.name}-${index}`" class="message-attachment">
          {{ attachment.type === 'image' ? 'IMG' : 'FILE' }} {{ attachment.name }}
        </span>
      </div>
    </div>

    <!-- Assistant message: full-width, no bubble -->
    <div v-else class="assistant-content">
      <!-- Image display -->
      <ChatImageDisplay
        v-if="hasImages"
        :image-urls="message.image_urls!"
        :prompt="message.content"
      />

      <!-- Text content with Markdown -->
      <div
        v-else
        class="markdown-body"
        v-html="renderedContent"
        @click="handleMarkdownClick"
      ></div>

      <Transition name="copy-toast">
        <div v-if="codeCopied" class="copy-toast">复制成功</div>
      </Transition>

      <!-- Streaming indicator -->
      <span v-if="isStreaming" class="streaming-dot"></span>

      <!-- Copy button -->
      <div class="message-actions" v-show="showCopy && !isStreaming && message.content">
        <button class="copy-btn" @click="copyContent" :title="copied ? 'Copied!' : 'Copy'">
          <svg v-if="!copied" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-row {
  padding: 4px 0;
  display: flex;
}

.user-row {
  justify-content: flex-end;
}

.assistant-row {
  justify-content: flex-start;
}

/* User bubble */
.user-bubble {
  max-width: 85%;
  padding: 10px 16px;
  background: var(--color-primary, #6366f1);
  color: white;
  border-radius: 18px 18px 4px 18px;
  font-size: 15px;
  line-height: 1.5;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
}

.message-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.message-attachment {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 3px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 12px;
}

/* Assistant content */
.assistant-content {
  max-width: 100%;
  position: relative;
  padding: 4px 0;
}

.streaming-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--color-text-tertiary, #9ca3af);
  border-radius: 50%;
  margin-left: 4px;
  vertical-align: middle;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.message-actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  background: var(--color-bg-primary, #ffffff);
  color: var(--color-text-tertiary, #9ca3af);
  cursor: pointer;
  transition: all 0.15s ease;
}

.copy-btn:hover {
  color: var(--color-text-primary, #1f2937);
  border-color: var(--color-text-tertiary, #9ca3af);
}

/* Markdown Body Styles */
.markdown-body {
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-text-primary, #1f2937);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.markdown-body :deep(p) {
  margin: 0 0 10px;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 6px 0 10px;
  padding-left: 24px;
}

.markdown-body :deep(li) {
  margin: 3px 0;
}

.markdown-body :deep(blockquote) {
  margin: 10px 0;
  padding: 6px 14px;
  border-left: 3px solid var(--color-border, #e5e7eb);
  color: var(--color-text-secondary, #6b7280);
  background: var(--color-bg-secondary, #f9fafb);
  border-radius: 0 6px 6px 0;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 18px 0 8px;
  font-weight: 600;
}

.markdown-body :deep(h1) { font-size: 1.4em; }
.markdown-body :deep(h2) { font-size: 1.2em; }
.markdown-body :deep(h3) { font-size: 1.1em; }

.markdown-body :deep(hr) {
  margin: 14px 0;
  border: none;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.markdown-body :deep(a) {
  color: var(--color-primary, #6366f1);
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

/* Table Styles */
.markdown-body :deep(.table-wrapper) {
  overflow-x: auto;
  margin: 10px 0;
  border-radius: 8px;
  border: 1px solid var(--color-border, #e5e7eb);
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.markdown-body :deep(th) {
  background: var(--color-bg-secondary, #f9fafb);
  font-weight: 600;
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.markdown-body :deep(td) {
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.04));
}

.markdown-body :deep(tr:last-child td) {
  border-bottom: none;
}

/* Code Block Styles */
.markdown-body :deep(.code-block-wrapper) {
  margin: 12px 0;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--color-code-border, #d1d5db);
  background: var(--color-code-bg, #f8fafc);
}

.markdown-body :deep(.code-block-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: var(--color-code-header-bg, #eef2f7);
  border-bottom: 1px solid var(--color-code-border, #d1d5db);
}

.markdown-body :deep(.code-lang) {
  font-size: 12px;
  color: var(--color-code-lang, #475569);
  text-transform: lowercase;
}

.markdown-body :deep(.code-copy-btn) {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border: 1px solid var(--color-code-copy-border, #cbd5e1);
  border-radius: 6px;
  background: var(--color-code-copy-bg, #ffffff);
  color: var(--color-code-copy-text, #334155);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.markdown-body :deep(.code-copy-btn:hover) {
  background: var(--color-code-copy-hover-bg, #e2e8f0);
  color: var(--color-code-copy-hover-text, #0f172a);
}

.markdown-body :deep(.code-copy-btn.copied) {
  border-color: var(--color-code-copy-done-border, #22c55e);
  background: var(--color-code-copy-done-bg, #dcfce7);
  color: var(--color-code-copy-done-text, #15803d);
}

.markdown-body :deep(.code-block) {
  margin: 0;
  padding: 14px 16px;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  background: var(--color-code-bg, #f8fafc);
  color: var(--color-code-text, #1e293b);
}

.markdown-body :deep(.code-block code) {
  font-family: inherit;
  font-size: inherit;
}

/* Inline Code */
.markdown-body :deep(.inline-code) {
  background: var(--color-bg-inline-code, rgba(0, 0, 0, 0.05));
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.88em;
  color: var(--color-text-primary, #1f2937);
}

/* Highlight.js Theme */
.markdown-body :deep(.hljs-keyword) { color: var(--color-hljs-keyword, #7c3aed); }
.markdown-body :deep(.hljs-string) { color: var(--color-hljs-string, #047857); }
.markdown-body :deep(.hljs-number) { color: var(--color-hljs-number, #b45309); }
.markdown-body :deep(.hljs-comment) { color: var(--color-hljs-comment, #64748b); font-style: italic; }
.markdown-body :deep(.hljs-function) { color: var(--color-hljs-function, #2563eb); }
.markdown-body :deep(.hljs-title) { color: var(--color-hljs-title, #1d4ed8); }
.markdown-body :deep(.hljs-params) { color: var(--color-hljs-params, #be185d); }
.markdown-body :deep(.hljs-built_in) { color: var(--color-hljs-built-in, #9333ea); }
.markdown-body :deep(.hljs-type) { color: var(--color-hljs-type, #0f766e); }
.markdown-body :deep(.hljs-attr) { color: var(--color-hljs-attr, #0369a1); }
.markdown-body :deep(.hljs-variable) { color: var(--color-hljs-variable, #334155); }
.markdown-body :deep(.hljs-literal) { color: var(--color-hljs-literal, #c2410c); }
.markdown-body :deep(.hljs-meta) { color: var(--color-hljs-meta, #be123c); }
.markdown-body :deep(.hljs-selector-class) { color: var(--color-hljs-selector-class, #047857); }
.markdown-body :deep(.hljs-selector-tag) { color: var(--color-hljs-selector-tag, #7c3aed); }
.markdown-body :deep(.hljs-selector-id) { color: var(--color-hljs-selector-id, #2563eb); }
.markdown-body :deep(.hljs-addition) { color: var(--color-hljs-addition, #047857); background: var(--color-hljs-addition-bg, #dcfce7); }
.markdown-body :deep(.hljs-deletion) { color: var(--color-hljs-deletion, #be123c); background: var(--color-hljs-deletion-bg, #fee2e2); }

.copy-toast {
  position: absolute;
  right: 0;
  top: -28px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #16a34a;
  color: white;
  font-size: 12px;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.24);
}

.copy-toast-enter-active,
.copy-toast-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.copy-toast-enter-from,
.copy-toast-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
