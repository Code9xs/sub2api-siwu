<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="empty-state">
    <h1 class="empty-heading">{{ t('chat.emptyTitle') }}</h1>
    <p class="empty-sub">{{ t('chat.emptyDescription') }}</p>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 48px 24px 0;
  text-align: center;
}

.empty-heading {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary, #1f2937);
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.empty-sub {
  font-size: 15px;
  color: var(--color-text-tertiary, #9ca3af);
  margin: 0;
  max-width: 400px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .empty-heading {
    font-size: 22px;
  }
}
</style>
