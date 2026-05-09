<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { Conversation } from '@/api/chat'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  conversation: Conversation
  active: boolean
}>()

const emit = defineEmits<{
  select: []
  delete: []
  rename: [title: string]
}>()

const showMenu = ref(false)
const isEditing = ref(false)
const editTitle = ref('')
const editInput = ref<HTMLInputElement | null>(null)

function openMenu(e: MouseEvent) {
  e.stopPropagation()
  showMenu.value = true
}

function closeMenu() {
  showMenu.value = false
}

async function startRename() {
  showMenu.value = false
  isEditing.value = true
  editTitle.value = props.conversation.title
  await nextTick()
  editInput.value?.focus()
  editInput.value?.select()
}

function confirmRename() {
  const newTitle = editTitle.value.trim()
  if (newTitle && newTitle !== props.conversation.title) {
    emit('rename', newTitle)
  }
  isEditing.value = false
}

function cancelRename() {
  isEditing.value = false
}

function handleRenameKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    confirmRename()
  } else if (e.key === 'Escape') {
    cancelRename()
  }
}

function handleDelete() {
  showMenu.value = false
  emit('delete')
}
</script>

<template>
  <div
    class="conv-item"
    :class="{ active }"
    @click="emit('select')"
    @mouseleave="closeMenu"
  >
    <!-- Editing mode -->
    <div v-if="isEditing" class="edit-wrapper" @click.stop>
      <input
        ref="editInput"
        v-model="editTitle"
        class="edit-input"
        @keydown="handleRenameKeydown"
        @blur="confirmRename"
      />
    </div>

    <!-- Normal mode -->
    <template v-else>
      <div class="conv-title">{{ conversation.title }}</div>
      <button class="menu-trigger" @click="openMenu" :title="t('chat.moreActions')">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/>
        </svg>
      </button>
    </template>

    <!-- Context menu -->
    <div v-if="showMenu" class="context-menu" @click.stop>
      <button class="menu-item" @click="startRename">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        <span>{{ t('chat.rename') }}</span>
      </button>
      <button class="menu-item danger" @click="handleDelete">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
        </svg>
        <span>{{ t('chat.delete') }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.conv-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s ease;
  position: relative;
}

.conv-item:hover {
  background: var(--color-bg-hover, rgba(0, 0, 0, 0.04));
}

.conv-item.active {
  background: var(--color-bg-active, rgba(0, 0, 0, 0.06));
}

.conv-title {
  flex: 1;
  font-size: 14px;
  color: var(--color-text-primary, #1f2937);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.menu-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-tertiary, #9ca3af);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.12s ease, background 0.12s ease;
  flex-shrink: 0;
}

.conv-item:hover .menu-trigger {
  opacity: 1;
}

.menu-trigger:hover {
  background: var(--color-bg-hover, rgba(0, 0, 0, 0.06));
  color: var(--color-text-primary, #1f2937);
}

/* Edit mode */
.edit-wrapper {
  flex: 1;
}

.edit-input {
  width: 100%;
  padding: 2px 6px;
  border: 1px solid var(--color-primary, #6366f1);
  border-radius: 4px;
  font-size: 14px;
  color: var(--color-text-primary, #1f2937);
  background: var(--color-bg-primary, #ffffff);
  outline: none;
}

/* Context menu */
.context-menu {
  position: absolute;
  top: 100%;
  right: 8px;
  z-index: 50;
  min-width: 140px;
  background: var(--color-bg-primary, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-primary, #1f2937);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.1s ease;
}

.menu-item:hover {
  background: var(--color-bg-hover, rgba(0, 0, 0, 0.04));
}

.menu-item.danger {
  color: var(--color-danger, #ef4444);
}

.menu-item.danger:hover {
  background: rgba(239, 68, 68, 0.06);
}
</style>
