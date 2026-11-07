<template>
  <div class="flex flex-1 flex-col gap-3 sm:gap-6 min-h-0">
    <div class="discovery-modes" role="tablist" :aria-label="t('discovery.mode')">
      <Button v-for="choice in ['inventory','catalog'] as const" :key="choice" class="mode-button" size="sm" variant="ghost" role="tab" :id="`discovery-tab-${choice}`" aria-controls="discovery-panel" :aria-selected="mode === choice" :tabindex="mode === choice ? 0 : -1" @keydown="onModeKeydown" @click="setDiscoveryMode(choice)">
        <component :is="choice === 'inventory' ? Boxes : Palette" :size="18" class="size-[18px]" aria-hidden="true" />
        {{ t(`discovery.${choice}`) }}
      </Button>
    </div>
    <!-- Filter Modal (opened via navbar) -->
    <FilterModal
      :is-open="filterModalOpen ?? false"
      :initial-filters="filters"
      :mode="mode"
      :vendor-options="vendorOptions"
      :material-options="materialOptions"
      :location-options="locationOptions"
      @close="closeFilterModal"
      @apply="applyFilters"
    />

    <section id="discovery-panel" role="tabpanel" :aria-labelledby="`discovery-tab-${mode}`" tabindex="0" class="flex flex-1 flex-col gap-3 sm:gap-6 min-h-0">
      <div v-if="loading && allFilaments.length === 0" class="text-sm text-[rgb(var(--text-muted))]">
        {{ t("status.loading") }}
      </div>
      <div v-else-if="error" class="text-sm text-red-400">
        {{ t("status.error") }} ({{ error }}) <button @click="refresh()">{{ t("app.retry") }}</button>
      </div>
      <div v-else-if="filtered.length === 0" class="text-sm text-[rgb(var(--text-muted))]">
        {{ t("status.empty") }}
      </div>
      <div v-else class="flex flex-col flex-1 gap-4 min-h-0">
        <FilamentCarousel
          v-if="viewMode === 'carousel'"
          :items="filtered"
          :count-label="countLabel"
          :labels="cardLabels"
          :filters="filters"
          :sort-labels="sortLabels"
          :view-mode="viewMode"
          @togglePin="togglePin"
          @selectFilament="selectFilament"
          @changeView="viewMode = $event"
          :pinned-ids="pinnedIds ?? new Set<string>()"
        />

        <FilamentBoard
          v-else
          :filaments="filtered"
          :pinned-ids="pinnedIds ?? new Set<string>()"
          :labels="boardLabels"
          :filters="filters"
          :sort-labels="sortLabels"
          :view-mode="viewMode"
          @changeView="viewMode = $event"
          :title="countLabel"
          @togglePin="togglePin"
          @selectFilament="selectFilament"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import { Boxes, Palette } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { useI18n } from "vue-i18n";
import { useFilaments } from "../composables/useFilaments";
import FilterModal from "../components/FilterModal.vue";
import FilamentCarousel from "../components/FilamentCarousel.vue";
import FilamentBoard from "../components/FilamentBoard.vue";
import type { FilamentCard } from "../composables/useFilaments";
import type { Ref } from "vue";

const { t } = useI18n();
const {
  mode, setDiscoveryMode, refresh,
  filtered,
  filters,
  vendorOptions,
  materialOptions,
  colorOptions,
  locationOptions,
  loading,
  error,
  allFilaments,
} = useFilaments();

// Inject shared state from MainApp
const viewMode = inject<Ref<"carousel" | "board">>("viewMode");
const pinnedIds = inject<Ref<Set<string>>>("pinnedIds");
const selectedFilament = inject<Ref<FilamentCard | null>>("selectedFilament");
const filterModalOpen = inject<Ref<boolean>>("filterModalOpen");

const togglePin = inject<(filament: { id: string }) => void>("togglePin");
const selectFilament = inject<(filament: FilamentCard) => void>("selectFilament");

const onModeKeydown=(event:KeyboardEvent)=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();
  const next=event.key==='Home'?'inventory':event.key==='End'?'catalog':mode.value==='inventory'?'catalog':'inventory';
  void setDiscoveryMode(next);document.getElementById(`discovery-tab-${next}`)?.focus();
};

const closeFilterModal = () => { if (filterModalOpen) filterModalOpen.value = false; };

// Handle filter apply
const applyFilters = (newFilters: Pick<typeof filters,'vendor'|'material'|'location'|'source'|'colorType'|'inventoryScope'>) => {
  filters.inventoryScope = newFilters.inventoryScope;
  filters.vendor = newFilters.vendor;
  filters.material = newFilters.material;
  filters.location = newFilters.location;
  filters.source = newFilters.source;
  filters.colorType = newFilters.colorType;
};

const countLabel = computed(() =>
  t("info.count", { count: filtered.value.length }),
);

const cardLabels = computed(() => ({
  vendor: t("card.vendor"),
  material: t("card.material"),
  spool: t("card.spool"),
  weight: t("card.weight"),
  copy: t("actions.copy"),
  copied: t("actions.copied"),
  pin: t("actions.pin"),
  unpin: t("actions.unpin"),
}));

const boardLabels = computed(() => ({
  pin: t("actions.pin"),
  unpin: t("actions.unpin"),
  legend: t("info.legend"),
}));

const sortLabels = computed(() => ({
  name: t('filters.sortNameAsc'),
  vendor: t('filters.sortVendorAsc'),
  material: t('filters.sortMaterialAsc'),
  source: t('filters.sortSourceAsc'),
  hue: t('filters.sortHueAsc'),
  luminance: t('filters.sortLuminanceAsc'),
  lightness: t('filters.sortLightnessAsc'),
}));
</script>

<style scoped>
.discovery-modes {display:flex;align-items:center;gap:16px;border-bottom:1px solid var(--border);}
.mode-button {min-height:40px;padding:8px 4px;border-radius:0;border-bottom:2px solid transparent;font-family:var(--font-sans);font-size:14px;font-weight:600;gap:8px;color:var(--muted-foreground);}
.mode-button[aria-selected="true"] {border-bottom-color:var(--primary);color:var(--primary);}
.mode-button:hover {background:var(--muted);color:var(--foreground);}
</style>
