<script setup lang="ts">
import {useI18n} from 'vue-i18n';
import {formatNumber} from '@/filaman/format';
import {normalizeColor} from '@/lib/colorUtils';
import { computed } from 'vue';
import type { FilamentCard } from '@/composables/useFilaments';
import { getFlatSwatchStyle } from '@/lib/swatchUtils';
import FilamentDetailHeader from './FilamentDetailHeader.vue';
import FilamentDetailInfo from './FilamentDetailInfo.vue';
import FilamentSpoolsList from './FilamentSpoolsList.vue';
import FilamentColorWheel from './FilamentColorWheel.vue';
import FilamentColorHarmonies from './FilamentColorHarmonies.vue';

const {t}=useI18n();
const props = defineProps<{
  filament: FilamentCard | null;
  allFilaments: FilamentCard[];
  labels: {
    color: string;
    details: string;
    spoolId: string;
    remainingWeight: string;
    similarColors: string;
    complementaryColors: string;
    spools: string;
    archived: string;
    remaining: string;
    used: string;
    colorHarmonies: string;
    currentColor: string;
    complementary: string;
    similar: string;
  };
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'selectFilament', filament: FilamentCard): void;
}>();

const opacity = computed(()=>(normalizeColor(props.filament?.colorHex)?.alpha ?? 1)*100);

const colorStops = computed(() => props.filament?.colors.length
  ? props.filament.colors.map(color => color.hex)
  : [props.filament?.colorHex ?? '']);
const pattern = computed(() => props.filament?.nativeColorStyle === 'striped' ? 'striped' : 'gradient');
const labelRows = computed(() => Math.ceil(colorStops.value.length / 4));
const stopLabels = computed(() => colorStops.value.map((hex, index) => {
  const count = colorStops.value.length;
  const position = count === 1 ? 0 : pattern.value === 'striped'
    ? (index + .5) / count
    : index / (count - 1);
  return {
    hex,
    opacity: (normalizeColor(hex)?.alpha ?? 1) * 100,
    position,
    bottom: `${12 + (index % labelRows.value) * 36}px`,
  };
}));

const swatchStyle = computed(() => {
  if (!props.filament) return {};
  return getFlatSwatchStyle(
    props.filament.colorHex,
    props.filament.multiColorHexes,
    undefined,
    pattern.value
  );
});

const showSpools = computed(() => {
  return props.filament?.kind === 'inventory' &&
    props.filament?.spools &&
    props.filament.spools.length > 0;
});
</script>

<template>
  <Transition name="slide-in">
    <div v-if="filament" class="detail-panel">
      <FilamentDetailHeader
        :name="filament.name"
        :vendor="filament.vendor"
        :material="filament.material"
        :logo-url="filament.logoUrl"
        :filaman-href="filament.kind === 'inventory' ? `/filaments/${filament.nativeId}` : '/filaments/colors'"
        @close="emit('close')"
      />

      <div class="detail-body">
        <!-- Color Swatch -->
        <div class="detail-section">
          <div class="color-heading">
            <h3 class="section-title">{{ labels.color }}</h3>
            <span v-if="colorStops.length > 1" class="color-pattern">
              {{ t('detail.multicolorPattern', { pattern: t(`detail.pattern.${pattern}`) }) }}
            </span>
          </div>
          <div class="color-swatch-large" :class="{ 'color-swatch-gradient': pattern === 'gradient' }"
            :style="[swatchStyle, { minHeight: `${labelRows * 36 + 24}px` }]">
            <template v-if="colorStops.length > 1">
              <div
                v-for="(stop, index) in stopLabels"
                :key="index"
                class="color-stop"
                :style="{ '--stop-position': stop.position, bottom: stop.bottom }"
              >
                <span class="color-hex">{{ stop.hex }}</span>
                <span v-if="stop.opacity < 100" class="color-stop-opacity"
                  :aria-label="`${t('discovery.opacity')}: ${formatNumber(stop.opacity, 1)}%`">
                  {{ formatNumber(stop.opacity, 1) }}%
                </span>
              </div>
            </template>
            <template v-else>
              <div class="color-info">
                <span class="color-hex">{{ filament.colorHex.toUpperCase() }}</span>
              </div>
              <span v-if="opacity < 100" class="opacity-badge" :aria-label="`${t('discovery.opacity')}: ${formatNumber(opacity,1)}%`">{{ formatNumber(opacity,1) }}%</span>
            </template>
          </div>
        </div>

        <!-- Filament Details -->
        <p v-if="filament.kind === 'catalog'">{{ t('discovery.usage', {count:filament.usageCount}) }}</p>
        <FilamentDetailInfo v-if="filament.kind === 'inventory'"
          :filament="filament"
          :labels="{ details: labels.details }"
        />

        <!-- Spools List -->
        <FilamentSpoolsList
          v-if="showSpools"
          :spools="filament.spools!"
          :colors="filament.colors.map(c => c.hex)"
          :color-style="filament.nativeColorStyle ?? 'gradient'"
          :labels="{
            spools: labels.spools,
            archived: labels.archived,
            remaining: labels.remaining,
            used: labels.used,
          }"
        />

        <!-- Color Wheel -->
        <FilamentColorWheel
          :filament="filament"
          :all-filaments="allFilaments"
          :labels="{
            colorHarmonies: labels.colorHarmonies,
            currentColor: labels.currentColor,
            complementary: labels.complementary,
            similar: labels.similar,
          }"
          @select-filament="emit('selectFilament', $event)"
        />

        <!-- Color Harmonies -->
        <FilamentColorHarmonies
          :filament="filament"
          :all-filaments="allFilaments"
          :labels="{
            similarColors: labels.similarColors,
            complementaryColors: labels.complementaryColors,
          }"
          @select-filament="emit('selectFilament', $event)"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.detail-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 400px;
  max-width: 90vw;
  border-left: 1px solid var(--border);
  box-shadow: -8px 0 32px -8px rgba(0, 0, 0, 0.5);
  background: var(--card);
  z-index: 1000;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
}

.detail-body {
  padding: 20px;
  padding-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
  overflow-y: auto;
}

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

.color-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.color-pattern {
  color: var(--muted-foreground);
  font-size: 12px;
  font-weight: 600;
}

.color-stop {
  position: absolute;
  left: clamp(31px, calc(100% * var(--stop-position)), calc(100% - 31px));
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  white-space: nowrap;
  padding: 4px 3px;
  border-radius: 6px;
  background: rgba(0, 0, 0, .72);
  color: white;
  line-height: 1.2;
}

.color-swatch-gradient .color-stop {
  left: calc(31px + (100% - 62px) * var(--stop-position));
}

.color-stop .color-hex, .color-stop-opacity {
  font-size: 10px;
}

.color-swatch-large {
  position:relative;
  height: 180px;
  border-radius: 16px;
  display: flex;
  align-items: flex-end;
  padding: 16px;
  border: 1px solid var(--border);
  box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.3);
}

.color-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(0, 0, 0, 0.6);
  padding: 8px 12px;
  border-radius: 8px;
  backdrop-filter: blur(8px);
}

.color-hex {
  font-family: 'Courier New', monospace;
  font-size:12px;
  font-weight:600;
  color: white;
}

/* Transition */
.slide-in-enter-active,
.slide-in-leave-active {
  transition: transform 300ms ease, opacity 300ms ease;
}

.slide-in-enter-from,
.slide-in-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>

<style scoped>
.opacity-badge {position:absolute;right:16px;bottom:16px;padding:4px 7px;border-radius:999px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;font-weight:600;line-height:1.2;}
</style>
