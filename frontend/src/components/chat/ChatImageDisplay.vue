<script setup lang="ts">
/**
 * ChatImageDisplay - Displays generated images in a grid
 * Supports base64 and URL images with lightbox preview
 */
import { ref } from 'vue'

defineProps<{
  imageUrls: string[]
  prompt?: string
}>()

const lightboxSrc = ref<string | null>(null)

function openLightbox(src: string) {
  lightboxSrc.value = src
}

function closeLightbox() {
  lightboxSrc.value = null
}

function downloadImage(src: string, index: number) {
  const a = document.createElement('a')
  a.href = src
  a.download = `generated-image-${index + 1}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>

<template>
  <div class="image-display">
    <div class="image-grid" :class="{ 'single': imageUrls.length === 1, 'double': imageUrls.length === 2 }">
      <div v-for="(url, i) in imageUrls" :key="i" class="image-item">
        <img
          :src="url"
          :alt="`Generated image ${i + 1}`"
          loading="lazy"
          @click="openLightbox(url)"
        />
        <div class="image-actions">
          <button class="img-action-btn" @click.stop="downloadImage(url, i)" title="Download">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <div v-if="lightboxSrc" class="lightbox-overlay" @click="closeLightbox">
        <div class="lightbox-content" @click.stop>
          <button class="lightbox-close" @click="closeLightbox">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <img :src="lightboxSrc" alt="Full size preview" />
          <p v-if="prompt" class="lightbox-prompt">{{ prompt }}</p>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.image-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, 1fr);
  margin: 8px 0;
}

.image-grid.single {
  grid-template-columns: 1fr;
  max-width: 400px;
}

.image-grid.double {
  grid-template-columns: repeat(2, 1fr);
  max-width: 520px;
}

.image-item {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s ease;
  border: 1px solid var(--color-border, #e5e7eb);
}

.image-item:hover {
  transform: scale(1.02);
}

.image-item img {
  width: 100%;
  height: auto;
  display: block;
}

.image-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.image-item:hover .image-actions {
  opacity: 1;
}

.img-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  cursor: pointer;
  transition: background 0.15s ease;
}

.img-action-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

/* Lightbox */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.lightbox-content img {
  max-width: 100%;
  max-height: 85vh;
  border-radius: 8px;
  object-fit: contain;
}

.lightbox-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  opacity: 0.8;
  transition: opacity 0.15s ease;
}

.lightbox-close:hover {
  opacity: 1;
}

.lightbox-prompt {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  text-align: center;
  margin-top: 12px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}
</style>
