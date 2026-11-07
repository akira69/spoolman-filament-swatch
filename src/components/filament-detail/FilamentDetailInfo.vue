<script setup lang="ts">
import {formatMoney,formatNumber} from '@/filaman/format';
import {hostContext} from '@/filaman/context';
import { Icon } from '@iconify/vue';
import { InfoBadge } from '@/components/ui/info-badge';
import type { FilamentCard } from '@/composables/useFilaments';

defineProps<{
  filament: FilamentCard;
  labels: {
    details: string;
  };
}>();
</script>

<template>
  <div class="detail-section">
    <h3 class="section-title">{{ labels.details }}</h3>

    <div class="info-badges">
      <InfoBadge v-if="filament.weight" icon="lucide:weight" :value="`${formatNumber(filament.weight)}g`" />
      <InfoBadge v-if="filament.price != null" icon="lucide:banknote" :value="formatMoney(filament.price, filament.priceCurrency ?? hostContext.currency)" />
      <InfoBadge v-if="filament.density" icon="lucide:box" :value="`${formatNumber(filament.density)} g/cm³`" />
      <InfoBadge v-if="filament.diameter" icon="lucide:ruler" :value="`${formatNumber(filament.diameter)}mm`" />
      <InfoBadge v-if="filament.articleNumber" icon="lucide:hash" :value="filament.articleNumber" :wide="true" />
    </div>

  </div>
</template>

<style scoped>
.detail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgb(var(--text-muted));
  margin: 0;
}

.info-badges {
  display: flex;
  flex-wrap: wrap;
  gap:6px;
}
.info-badges :deep(.info-badge) {gap:4px;padding:5px 7px;font-size:12px;}
.info-badges :deep(.badge-icon) {width:12px;height:12px;}

.info-comment {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(var(--surface-alt), 0.3);
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 13px;
  color: rgb(var(--text-muted));
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.external-source-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(var(--accent-rgb), 0.08);
  border: 1px solid rgba(var(--accent-rgb), 0.2);
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
}

.external-source-notice.notice-external {
  background: rgba(150, 100, 255, 0.08);
  border-color: rgba(150, 100, 255, 0.2);
  color: rgb(150, 100, 255);
}

.notice-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notice-title {
  font-weight: 700;
  margin: 0;
  color: rgb(var(--text));
}

.notice-text {
  margin: 0;
  color: rgb(var(--text-muted));
}
</style>
