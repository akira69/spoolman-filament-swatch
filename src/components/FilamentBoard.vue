<template>
  <div class="board-wrapper">
    <div class="board-header">
      <div class="board-title">{{ title }}</div>
      <div class="board-actions">
        <!-- Sort Controls -->
        <Select v-model="filters.sortField" class="w-28 sm:w-36">
          <SelectTrigger variant="ghost" class="h-9 sm:h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{{ sortLabels.name }}</SelectItem>
            <SelectItem v-if="filaments[0]?.kind !== 'catalog'" value="vendor">{{ sortLabels.vendor }}</SelectItem>
            <SelectItem v-if="filaments[0]?.kind !== 'catalog'" value="material">{{ sortLabels.material }}</SelectItem>
            <SelectItem value="source">{{ sortLabels.source }}</SelectItem>
            <SelectItem value="hue">{{ sortLabels.hue }}</SelectItem>
            <SelectItem value="luminance">{{ sortLabels.luminance }}</SelectItem>
            <SelectItem value="lightness">{{ sortLabels.lightness }}</SelectItem>
          </SelectContent>
        </Select>
        <Toggle variant="ghost" size="sm" :pressed="filters.sortDir === 'asc'" @click="filters.sortDir = 'asc'" class="h-9 w-9 sm:h-10 sm:w-10">
          <Icon icon="lucide:arrow-up" class="w-4 h-4" />
        </Toggle>
        <Toggle variant="ghost" size="sm" :pressed="filters.sortDir === 'desc'" @click="filters.sortDir = 'desc'" class="h-9 w-9 sm:h-10 sm:w-10">
          <Icon icon="lucide:arrow-down" class="w-4 h-4" />
        </Toggle>
        
        <!-- View Toggle -->
        <div class="flex gap-1">
          <Button
            :variant="viewMode === 'carousel' ? 'default' : 'ghost'"
            size="sm"
            @click="$emit('changeView', 'carousel')"
            class="h-9 w-9 sm:h-10 sm:w-10 p-0"
          >
            <Icon icon="lucide:gallery-horizontal" class="w-4 h-4" />
          </Button>
          <Button
            :variant="viewMode === 'board' ? 'default' : 'ghost'"
            size="sm"
            @click="$emit('changeView', 'board')"
            class="h-9 w-9 sm:h-10 sm:w-10 p-0"
          >
            <Icon icon="lucide:layout-grid" class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>

    <div class="board-body">
      <div class="minimap" aria-label="Color minimap" @click.stop>
        <button
          v-for="(filament, index) in filaments"
          :key="filament.id"
          class="minimap-dot"
          :class="{ active: activeCardId === filament.id }"
          v-memo="[filament, index, activeCardId === filament.id]"
          :title="filament.name"
          :style="minimapStyle(filament)"
          @click.stop.prevent="scrollToCard(index, $event.detail === 0)"
        />
      </div>

      <div class="board-grid" :class="{ 'catalog-grid': isCatalog }" ref="gridRef"
        @scroll.passive="onScroll" @keydown="onCardKeydown">
        <div v-if="isCatalog" aria-hidden="true" :style="{height: `${catalogHeight}px`}" />
        <div class="board-cards" ref="cardsRef"
          :style="isCatalog ? {top: `${geometry.padding + firstRow * geometry.step}px`} : undefined">
        <div
          v-for="(filament, index) in renderedCards"
          :key="filament.id"
          v-memo="[filament, startIndex + index, isPinned(filament.id), labels.pin, labels.unpin]"
          class="board-card"
          :id="cardId(filament.id)"
          :data-card-index="isCatalog ? startIndex + index : undefined"
          :style="{
            '--swatch': filament.colorHex
          }"
          @click="$emit('selectFilament', filament)"
        >
          <div class="swatch" :style="swatchStyle(filament)" />
          <div class="card-meta">
            <div class="card-top">
              <div>
                <button type="button" class="card-name w-full text-left" :title="isCatalog ? filament.name : undefined" @click.stop="$emit('selectFilament', filament)">{{ filament.name }}</button>
                <div v-if="filament.kind === 'inventory'" class="card-sub">
                  <VendorLogoBadge v-if="filament.vendor || filament.logoUrl" :vendor-name="filament.vendor ?? ''" :logo-url="filament.logoUrl" />
                  <span class="card-material">{{ filament.material }}</span>
                </div>
              </div>

            </div>
            <div class="card-bottom">
              <span class="card-hex">{{ filament.colorHex.toUpperCase() }}</span>
              <div class="card-actions">
                <ColorRgbReadout class="card-rgb" :color-hex="filament.colorHex" />
                <button
                  type="button"
                  class="pin-btn size-7 shrink-0"
                  :aria-pressed="isPinned(filament.id)"
                  @click.stop="$emit('togglePin', filament)"
                  :title="isPinned(filament.id) ? labels.unpin : labels.pin"
                >
                  <Icon :icon="isPinned(filament.id) ? 'lucide:pin-off' : 'lucide:pin'" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VendorLogoBadge from "./VendorLogoBadge.vue";
import { computed, nextTick, ref, watch, onMounted, onUnmounted } from "vue";
import type { FilamentCard as FilamentCardType } from "../composables/useFilaments";
import { Icon } from '@iconify/vue';
import { Button } from "@/components/ui/button";
import ColorRgbReadout from './ColorRgbReadout.vue';
import { getSwatchStyle } from '@/lib/swatchUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";

const props = defineProps<{
  filaments: FilamentCardType[];
  pinnedIds: Set<string> | string[];
  labels: {
    pin: string;
    unpin: string;
    legend: string;
  };
  sortLabels: {
    name: string;
    vendor: string;
    material: string;
    source: string;
    hue: string;
    luminance: string;
    lightness: string;
  };
  filters: {
    sortField: string;
    sortDir: string;
  };
  viewMode: string;
  title?: string;
}>();

defineEmits<{
  (e: "togglePin", filament: FilamentCardType): void;
  (e: "selectFilament", filament: FilamentCardType): void;
  (e: "changeView", view: "carousel" | "board"): void;
}>();

const gridRef = ref<HTMLElement | null>(null);
const cardsRef = ref<HTMLElement | null>(null);
const activeCardId = ref<string | null>(null);
const isCatalog = computed(() => props.filaments[0]?.kind === 'catalog');
const geometry = ref({columns: 1, step: 236, gap: 12, padding: 12, viewport: 0});
const scrollTop = ref(0);
const rowCount = computed(() => Math.ceil(props.filaments.length / geometry.value.columns));
const catalogHeight = computed(() => Math.max(0, rowCount.value * geometry.value.step - geometry.value.gap));
const viewportRow = computed(() => Math.floor(scrollTop.value / geometry.value.step));
const viewportRows = computed(() => Math.ceil(geometry.value.viewport / geometry.value.step));
const firstRow = computed(() => Math.max(0, viewportRow.value - viewportRows.value));
const lastRow = computed(() => Math.min(rowCount.value, viewportRow.value + 2 * viewportRows.value + 1));
const startIndex = computed(() => firstRow.value * geometry.value.columns);
const endIndex = computed(() => lastRow.value * geometry.value.columns);
const renderedCards = computed(() => isCatalog.value
  ? props.filaments.slice(startIndex.value, endIndex.value)
  : props.filaments);
let scrollFrame = 0;
let resizeObserver: ResizeObserver | undefined;

const updateActiveCard = () => {
  const grid = gridRef.value;
  if (!grid) return;
  if (isCatalog.value) {
    scrollTop.value = grid.scrollTop;
    const {columns, step, viewport, padding} = geometry.value;
    const row = Math.min(rowCount.value - 1, Math.max(0, Math.floor((grid.scrollTop + viewport / 2 - padding) / step)));
    activeCardId.value = props.filaments[row * columns]?.id ?? null;
    return;
  }
  const top = grid.scrollTop;
  const bottom = top + grid.clientHeight;
  const center = (top + bottom) / 2;
  const cards = cardsRef.value?.children as HTMLCollectionOf<HTMLElement> | undefined;
  if (!cards) return;

  // Flex rows stretch to a common height, so card bottoms are ordered by row.
  let first = 0;
  let end = cards.length;
  while (first < end) {
    const mid = (first + end) >>> 1;
    const card = cards[mid];
    if (card.offsetTop + card.offsetHeight < top) first = mid + 1;
    else end = mid;
  }

  let closest = null;
  let closestDistance = Infinity;
  for (let i = first; i < cards.length; i++) {
    const card = cards[i];
    const cardTop = card.offsetTop;
    if (cardTop > bottom) break;
    const distance = Math.abs(cardTop + card.offsetHeight / 2 - center);
    if (distance < closestDistance) {
      closest = card.id.slice('board-card-'.length);
      closestDistance = distance;
    }
  }
  activeCardId.value = closest;
};

watch(() => props.filaments, () => {
  if (isCatalog.value && gridRef.value) gridRef.value.scrollTop = 0;
  updateActiveCard();
}, { flush: 'post' });

const onScroll = () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    updateActiveCard();
  });
};

const measureGrid = () => {
  const grid = gridRef.value;
  if (!grid) return;
  const styles = getComputedStyle(grid);
  const padding = parseFloat(styles.paddingLeft);
  const gap = parseFloat(styles.getPropertyValue('--board-gap'));
  const width = parseFloat(styles.getPropertyValue('--board-card-width'));
  const height = parseFloat(styles.getPropertyValue('--catalog-card-height'));
  const columns = Math.max(1, Math.floor((grid.clientWidth - 2 * padding + gap) / (width + gap)));
  geometry.value = {columns, step: height + gap, gap, padding, viewport: grid.clientHeight};
  updateActiveCard();
};

onMounted(() => {
  if (gridRef.value) {
    measureGrid();
    resizeObserver = new ResizeObserver(measureGrid);
    resizeObserver.observe(gridRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  if (scrollFrame) cancelAnimationFrame(scrollFrame);
});

const isPinned = (id: string) => {
  if (Array.isArray(props.pinnedIds)) return props.pinnedIds.includes(id);
  return props.pinnedIds.has(id);
};

const swatchStyles = new WeakMap<FilamentCardType, ReturnType<typeof getSwatchStyle>>();
const swatchStyle = (filament: FilamentCardType) => {
  let style = swatchStyles.get(filament);
  if (!style) {
    style = getSwatchStyle(filament.colorHex,filament.material ?? '',filament.multiColorHexes,filament.multiColorDirection,filament.nativeColorStyle);
    swatchStyles.set(filament, style);
  }
  return style;
};

const cardId = (id: string) => `board-card-${id}`;

const scrollToCard = async (index: number, focus = false, target = '.card-name') => {
  const item = props.filaments[index];
  const grid = gridRef.value;
  if (!item || !grid) return;
  const id = cardId(item.id);
  if (isCatalog.value) {
    const {columns, step, viewport, padding} = geometry.value;
    const top = Math.floor(index / columns) * step + padding;
    if (!focus || top < grid.scrollTop || top + step > grid.scrollTop + viewport) {
      grid.scrollTop = top - (viewport - step) / 2;
      updateActiveCard();
      await nextTick();
    }
  } else {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }
  if (focus) document.getElementById(id)?.querySelector<HTMLElement>(target)?.focus({preventScroll: true});
};

const onCardKeydown = (event: KeyboardEvent) => {
  if (!isCatalog.value || !(event.target instanceof Element)) return;
  const card = event.target.closest<HTMLElement>('[data-card-index]');
  if (!card) return;
  const index = Number(card.dataset.cardIndex);
  const {columns} = geometry.value;
  const adjacent = {ArrowLeft: index - 1, ArrowRight: index + 1, ArrowUp: index - columns,
    ArrowDown: index + columns, Home: 0, End: props.filaments.length - 1};
  let next = adjacent[event.key as keyof typeof adjacent];
  let target = '.card-name';
  if (event.key === 'Tab' && !event.shiftKey && index === endIndex.value - 1 && event.target.matches('.pin-btn')) {
    next = index + 1;
  } else if (event.key === 'Tab' && event.shiftKey && index === startIndex.value && event.target.matches('.card-name')) {
    next = index - 1;
    target = '.pin-btn';
  }
  if (next === undefined || next < 0 || next >= props.filaments.length) return;
  event.preventDefault();
  void scrollToCard(next, true, target);
};
const minimapStyle = swatchStyle;
</script>

<style scoped>
.board-wrapper {
  border: 1px solid var(--border);
  background: rgba(var(--surface), 0.8);
  display: flex;
  flex-direction: column;
  gap:0;
  border-radius:var(--radius-md);
  flex:1;
  min-height:0;
  overflow:hidden;
}

@media (min-width: 640px) {
  .board-wrapper {
    gap:0;
  }
}

.board-header {
  padding:12px 16px;
  border-bottom:1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
  flex-wrap: wrap;
}

.board-title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

@media (min-width: 640px) {
  .board-title {
    font-size: 15px;
  }
}

.board-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.legend {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgb(var(--text-muted));
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.5), rgba(var(--accent-2), 0.7));
}

.board-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

@media (min-width: 640px) {
  .board-body {
    gap: 12px;
  }
}

.minimap {
  display: flex;
  flex-direction: row;
  flex-wrap:nowrap;
  overflow-x:auto;
  overflow-y:hidden;
  padding:6px;
  min-height:32px;
  gap:4px;
  border-bottom:1px solid var(--border);
  background:var(--muted);
  scrollbar-width:thin;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .minimap {
    gap: 6px;
  }
}

.board-grid {
  --board-gap: 12px;
  --board-padding: 12px;
  --board-card-width: 180px;
  --catalog-card-height: 224px;
  position: relative;
  overflow-y:auto;
  overflow-x: hidden;
  padding:var(--board-padding);
  flex: 1;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--accent-rgb), 0.5) rgba(var(--surface-alt), 0.4);
}

@media (min-width: 640px) {
  .board-grid {
    --board-gap: 16px;
    --board-padding: 16px;
    --board-card-width: 200px;
    --catalog-card-height: 254px;
  }
}

@media (min-width: 1200px) {
  .board-grid {
    --board-card-width: 220px;
  }
}

.board-cards {
  display: flex;
  flex-wrap: wrap;
  gap: var(--board-gap);
}

.catalog-grid {
  overflow-anchor: none;
}

.catalog-grid .board-cards {
  position: absolute;
  left: var(--board-padding);
  right: var(--board-padding);
}

.catalog-grid .board-card {
  height: var(--catalog-card-height);
  content-visibility: visible;
}

.catalog-grid .card-name {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  overflow-wrap: anywhere;
}

/* Custom Scrollbar - WebKit (Chrome, Edge, Safari) */
.board-grid::-webkit-scrollbar {
  width: 10px;
}

.board-grid::-webkit-scrollbar-track {
  background: rgba(var(--surface-alt), 0.4);
  border-radius: 10px;
  margin: 2px 0;
}

.board-grid::-webkit-scrollbar-thumb {
  background: rgba(var(--accent-rgb), 0.5);
  border-radius: 10px;
  border: 2px solid rgba(var(--surface), 0.8);
  transition: background 200ms ease;
}

.board-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--accent-rgb), 0.7);
}

.board-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(var(--surface-alt), 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
  /* Fixed width based on viewport */
  flex: 0 0 var(--board-card-width);
  /* Performance optimizations */
  content-visibility: auto;
  contain-intrinsic-size: 180px 220px;
  contain: layout style paint;
}

@media (min-width: 641px) {
  .board-card {
    border-radius: 16px;
    contain-intrinsic-size: 200px 240px;
  }
}

.board-card:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--accent-rgb), 0.6);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1);
}

.swatch {
  width: 100%;
  height: 110px;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .swatch {
    height: 130px;
  }
}

.card-meta {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

@media (min-width: 640px) {
  .card-meta {
    padding: 12px;
    gap: 10px;
  }
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.card-name {
  font-weight: 700;
  font-size: 13px;
  line-height: 1.3;
}

@media (min-width: 640px) {
  .card-name {
    font-size: 15px;
  }
}

.card-sub {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: rgb(var(--text-muted));
  line-height: 1.3;
}

@media (min-width: 640px) {
  .card-sub {
    font-size: 12px;
  }
}

.card-bottom {
  display:flex;
  flex-direction:column;
  align-items:stretch;
  gap:2px;
  margin-top:auto;
  font-size: 12px;
}

.card-top > div {width:100%;min-width:0;}

.card-hex {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  color: rgb(var(--text));
  font-size: 11px;
}

.card-rgb {
  white-space:nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  color: rgb(var(--text-muted));
  font-size: 11px;
}



.pin-btn {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(var(--surface-alt), 0.8);
  color: rgb(var(--text));
  transition: all 120ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
}


.pin-btn:hover {
  border-color: rgba(var(--accent-2), 0.7);
  background: rgba(var(--accent-2), 0.12);
}

.pin-btn[aria-pressed="true"] {
  border-color: rgba(var(--accent-rgb), 0.7);
  background: rgba(var(--accent-rgb), 0.18);
  color: rgb(var(--text));
}

.minimap-dot {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border-radius: 5px;
  border: 1px solid var(--border);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease;
}

@media (min-width: 640px) {
  .minimap-dot {
    width: 20px;
    height: 20px;
    border-radius: 6px;
  }
}

.minimap-dot:hover {
  transform: translateY(-2px) scale(1.03);
  border-color: rgba(var(--accent-rgb), 0.7);
}

.minimap-dot.active {
  transform: scale(1.15);
  border-color: rgba(var(--accent-2), 0.9);
  box-shadow: 
    0 0 0 2px rgba(var(--accent-2), 0.3),
    inset 0 0 0 1px rgba(255, 255, 255, 0.4);
  z-index: 1;
}

@media (max-width: 900px) {
  .board-body {
    flex-direction: column;
  }
}
</style>
