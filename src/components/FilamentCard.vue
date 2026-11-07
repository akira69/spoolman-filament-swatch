<template>
  <div
    class="card-container group relative flex h-full flex-col gap-3 sm:gap-4 rounded-2xl sm:rounded-3xl border border-[var(--border)] bg-[rgba(var(--surface),0.95)] p-4 sm:p-5 shadow-2xl shadow-black/10 cursor-pointer transition-all hover:border-[rgba(var(--accent-rgb),0.6)]"
    @click="$emit('selectFilament', filament)"
  >
    <div class="flex items-start justify-between gap-2 sm:gap-3">
      <div>
        <button type="button" class="card-name text-base sm:text-lg font-semibold text-left w-full" @click.stop="$emit('selectFilament', filament)">{{ filament.name }}</button>
        <div class="flex items-center gap-2 text-xs sm:text-sm">
          <VendorLogoBadge v-if="filament.kind === 'inventory'" :vendor-name="filament.vendor ?? ''" :logo-url="filament.logoUrl" />
          <span class="text-[rgb(var(--text-muted))]">·</span>
          <span class="text-[rgb(var(--text-muted))]">{{ filament.material }}</span>
        </div>
      </div>

    </div>

    <div class="flex flex-1 items-center justify-center">
      <div
        class="h-32 w-32 sm:h-40 sm:w-40 rounded-full border border-white/40 shadow-[0_25px_60px_-30px_rgba(0,0,0,0.6)]"
        :style="swatchStyle"
        role="img"
        :aria-label="filament.colorName"
      />
    </div>

    <div v-if="filament.kind === 'inventory'" class="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-[rgb(var(--text-muted))]">
      <div class="flex items-center justify-between">
        <span class="uppercase tracking-wide">{{ labels.vendor }}</span>
        <span class="text-[rgb(var(--text))]">{{ filament.vendor }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="uppercase tracking-wide">{{ labels.material }}</span>
        <span class="text-[rgb(var(--text))]">{{ filament.material }}</span>
      </div>
      <div v-if="filament.totalRemainingWeight != null" class="flex items-center justify-between">
        <span class="uppercase tracking-wide">{{ labels.weight }}</span>
        <span class="text-[rgb(var(--text))]">
          {{ formatNumber(filament.totalRemainingWeight) }} g
        </span>
      </div>
    </div>

    <div class="flex flex-col gap-0.5">
      <span class="mono text-[10px] sm:text-xs text-[rgb(var(--text-muted))]">
        HEX: {{ filament.colorHex.toUpperCase() }}
      </span>
      <div class="card-actions">
        <ColorRgbReadout class="mono card-rgb whitespace-nowrap text-[10px] sm:text-xs text-[rgb(var(--text-muted))]" :color-hex="filament.colorHex" />
        <div class="flex shrink-0 gap-1">
          <Button size="sm" variant="secondary" :title="labels.copy" @click.stop="copyHex" class="size-7 p-0">
            <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
          <button
            type="button"
            class="pin-btn size-7"
            :aria-pressed="pinned"
            @click.stop="$emit('togglePin', filament)"
            :title="pinned ? labels.unpin : labels.pin"
          >
            <Icon :icon="pinned ? 'lucide:pin-off' : 'lucide:pin'" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { FilamentCard as FilamentCardType } from "../composables/useFilaments";
import { Button } from "@/components/ui/button";
import { Icon } from '@iconify/vue';
import { getSwatchStyle } from '@/lib/swatchUtils';
import { formatNumber } from '@/filaman/format';
import ColorRgbReadout from './ColorRgbReadout.vue';
import VendorLogoBadge from './VendorLogoBadge.vue';

const props = defineProps<{
  filament: FilamentCardType;
  pinned?: boolean;
  labels: {
    vendor: string;
    material: string;
    spool: string;
    weight: string;
    copy: string;
    copied: string;
    pin: string;
    unpin: string;
  };
}>();

defineEmits<{
  (e: "togglePin", filament: FilamentCardType): void;
  (e: "selectFilament", filament: FilamentCardType): void;
}>();

const copied = ref(false);

const swatchStyle = computed(() => {
  const filament = props.filament;
  return getSwatchStyle(
    filament.colorHex,
    filament.material ?? '',
    filament.multiColorHexes,
    filament.multiColorDirection,
    filament.nativeColorStyle
  );
});

const copyHex = async () => {
  await navigator.clipboard.writeText(props.filament.colorHex);
  copied.value = true;
  window.setTimeout(() => {
    copied.value = false;
  }, 1200);
};
</script>

<style scoped>
.card-container {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
  transform: translateZ(0);
  contain: layout style paint;
}

.card-container:hover {
  transform: translate3d(0, -4px, 0);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.2);
}

.pin-btn {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(var(--surface-alt), 0.8);
  color: rgb(var(--text));
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
}
.pin-btn:hover {
  border-color: rgba(var(--accent-2), 0.7);
  background: rgba(var(--accent-2), 0.12);
  transform: scale(1.05) translateZ(0);
}
.pin-btn[aria-pressed="true"] {
  border-color: rgba(var(--accent-rgb), 0.7);
  background: rgba(var(--accent-rgb), 0.12);
}


</style>
