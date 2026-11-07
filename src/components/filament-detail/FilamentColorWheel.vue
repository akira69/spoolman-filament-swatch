<script setup lang="ts">
import {useI18n} from 'vue-i18n';
import {useId} from 'vue';
import { toRef, ref } from 'vue';
import { normalizeColor } from '@/lib/colorUtils';
import { useColorWheel, type HarmonyFilter } from '@/composables/useColorWheel';
import type { FilamentCard } from '@/composables/useFilaments';

const {t}=useI18n();
const showTransparency=ref(false);
const displayColor=(value:string)=>{const color=normalizeColor(value);return (showTransparency.value?color?.hex:color?.rgbHex) ?? '#888888';};
const isTransparent=(value:string)=>(normalizeColor(value)?.alpha ?? 1)<1;
const checkerId=`wheel-checker-${useId().replace(/:/g,'')}`;
const props = defineProps<{
  filament: FilamentCard;
  allFilaments: FilamentCard[];
  labels: {
    colorHarmonies: string;
    currentColor: string;
    complementary: string;
    similar: string;
  };
}>();

const emit = defineEmits<{
  (e: 'selectFilament', filament: FilamentCard): void;
}>();

const filamentRef = toRef(props, 'filament');
const allFilamentsRef = toRef(props, 'allFilaments');

const {
  activeFilter,
  toggleFilter,
  shouldShowSegment,
  colorWheelItems,
  complementaryColors,
  triadColors,
  isComplementary,
  isSimilar,
  isAnalogous,
  isSplitComplementary,
  isTriadic,
  getColorPosition,
  getArcPath,
  getOuterRingPath,
  getTrianglePoints,
} = useColorWheel(filamentRef, allFilamentsRef);
</script>

<template>
  <div class="detail-section">
    <div class="wheel-heading">
      <h3 class="section-title">{{ labels.colorHarmonies }}</h3>
      <label class="wheel-transparency"><input type="checkbox" v-model="showTransparency" />{{ t('detail.includeTransparency') }}</label>
    </div>
    <div class="color-wheel">
      <svg viewBox="-10 -10 220 220" class="wheel-svg">
        <defs v-if="showTransparency"><pattern :id="checkerId" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#eee"/><path d="M0 0h4v4H0zM4 4h4v4H4z" fill="#aaa"/></pattern></defs>
        <!-- Outer wheel segments -->
        <g v-for="(item, index) in colorWheelItems" :key="index"><template v-if="item">
          <path v-if="showTransparency && isTransparent(item.colorHex)" :d="getArcPath(index, colorWheelItems.length)" :fill="`url(#${checkerId})`" pointer-events="none" />
          <path
            :d="getArcPath(index, colorWheelItems.length)"
            :fill="displayColor(item.colorHex)"
            :class="['wheel-segment', {
              'active': item.id === filament.id,
              'complementary': isComplementary(item),
              'similar': isSimilar(item),
              'analogous': isAnalogous(item),
              'split-complementary': isSplitComplementary(item),
              'triadic': isTriadic(item),
              'faded': !shouldShowSegment(item)
            }]"
            @click="emit('selectFilament', item)"
          >
            <title>{{ item.vendor ? `${item.vendor} - ${item.name}` : item.name }}</title>
          </path>
          <!-- Highlight rings for harmony colors -->
          <path
            v-if="isComplementary(item)"
            :d="getOuterRingPath(index, colorWheelItems.length)"
            fill="none"
            stroke="#ff6464"
            stroke-width="4"
            class="harmony-ring complementary-ring"
          />
          <path
            v-if="isSimilar(item)"
            :d="getOuterRingPath(index, colorWheelItems.length)"
            fill="none"
            stroke="#64c8ff"
            stroke-width="4"
            class="harmony-ring similar-ring"
          />
          <path
            v-if="isAnalogous(item)"
            :d="getOuterRingPath(index, colorWheelItems.length)"
            fill="none"
            stroke="#ffd164"
            stroke-width="4"
            class="harmony-ring analogous-ring"
          />
          <path
            v-if="isSplitComplementary(item)"
            :d="getOuterRingPath(index, colorWheelItems.length)"
            fill="none"
            stroke="#ff64c8"
            stroke-width="4"
            class="harmony-ring split-ring"
          />
          <path
            v-if="isTriadic(item) && item.id !== filament.id"
            :d="getOuterRingPath(index, colorWheelItems.length)"
            fill="none"
            stroke="#64ffc8"
            stroke-width="4"
            class="harmony-ring triadic-ring"
          />
        </template></g>

        <!-- Harmony lines (Triad) -->
        <g v-if="triadColors.length === 3" class="harmony-lines">
          <polygon
            :points="getTrianglePoints()"
            fill="none"
            stroke="rgba(var(--accent-rgb), 0.4)"
            stroke-width="2"
            stroke-dasharray="4,4"
          />
        </g>

        <!-- Harmony lines (Complementary) -->
        <g v-if="complementaryColors.length > 0" class="harmony-lines">
          <line
            :x1="getColorPosition(filament).x"
            :y1="getColorPosition(filament).y"
            :x2="getColorPosition(complementaryColors[0]).x"
            :y2="getColorPosition(complementaryColors[0]).y"
            stroke="#ff6464"
            stroke-width="2.5"
            stroke-dasharray="4,4"
          />
        </g>

        <!-- Center circle with current color -->
        <circle v-if="showTransparency && isTransparent(filament.colorHex)" cx="100" cy="100" r="35" :fill="`url(#${checkerId})`" />
        <circle cx="100" cy="100" r="35" :fill="displayColor(filament.colorHex)" class="wheel-center"><title>{{ labels.currentColor }}: {{ filament.colorHex }}</title></circle>
        <circle cx="100" cy="100" r="35" fill="none" stroke="var(--border)" stroke-width="2" />
      </svg>

      <div class="wheel-legend">
        <button
          class="legend-item"
          :class="{ active: activeFilter === 'all' }"
          @click="toggleFilter('all')"
        >
          <div class="legend-dot current"></div>
          <span>{{ labels.currentColor }}</span>
        </button>
        <button
          class="legend-item"
          :class="{ active: activeFilter === 'complementary' }"
          @click="toggleFilter('complementary')"
        >
          <div class="legend-dot complementary"></div>
          <span>{{ labels.complementary }}</span>
        </button>
        <button
          class="legend-item"
          :class="{ active: activeFilter === 'analogous' }"
          @click="toggleFilter('analogous')"
        >
          <div class="legend-dot analogous"></div>
          <span>{{ t('detail.analogous') }}</span>
        </button>
        <button
          class="legend-item"
          :class="{ active: activeFilter === 'triadic' }"
          @click="toggleFilter('triadic')"
        >
          <div class="legend-dot triadic"></div>
          <span>{{ t('detail.triadic') }}</span>
        </button>
        <button
          class="legend-item"
          :class="{ active: activeFilter === 'split' }"
          @click="toggleFilter('split')"
        >
          <div class="legend-dot split"></div>
          <span>{{ t('detail.split') }}</span>
        </button>
        <button
          class="legend-item"
          :class="{ active: activeFilter === 'similar' }"
          @click="toggleFilter('similar')"
        >
          <div class="legend-dot similar"></div>
          <span>{{ labels.similar }}</span>
        </button>
      </div>
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

.color-wheel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding:0;
  background:transparent;
}

.wheel-svg {
  width: 100%;
  max-width: 240px;
  margin: 0 auto;
}

.wheel-segment {
  cursor: pointer;
  transition: opacity 200ms, transform 200ms;
}

.wheel-segment:hover {
  opacity: 0.8;
}

.wheel-segment.faded {
  opacity: 0.2;
}

.wheel-segment.active {
  stroke: white;
  stroke-width: 3;
}

.harmony-ring {
  pointer-events: none;
}

.wheel-center {
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
}

.wheel-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(var(--surface-alt), 0.4);
  border: 1px solid var(--border);
  border-radius: 20px;
  font-size: 11px;
  color: rgb(var(--text-muted));
  cursor: pointer;
  transition: all 150ms ease;
}

.legend-item:hover,
.legend-item.active {
  background: rgba(var(--surface-alt), 0.7);
  border-color: rgba(var(--accent-rgb), 0.5);
  color: rgb(var(--text));
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot.current {
  background: linear-gradient(135deg, #4080ff, #8040ff);
}

.legend-dot.complementary {
  background: #ff6464;
}

.legend-dot.analogous {
  background: #ffd164;
}

.legend-dot.triadic {
  background: #64ffc8;
}

.legend-dot.split {
  background: #ff64c8;
}

.legend-dot.similar {
  background: #64c8ff;
}
</style>

<style scoped>
.wheel-heading {display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}
.wheel-transparency {display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:400;color:var(--muted-foreground);cursor:pointer;}
.wheel-transparency input {width:13px;height:13px;margin:0;accent-color:var(--primary);}
</style>
