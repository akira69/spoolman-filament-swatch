<template>
  <div class="mx-auto flex h-screen flex-col overflow-hidden">
    <!-- Main Content Wrapper (gets blurred when panels are open) -->
    <div class="main-content-wrapper flex min-h-0 flex-1 flex-col" :class="{ blurred: paletteOpen || selectedFilament }">
      <!-- Top Navigation Bar -->
      <AppNavbar
        :pinned-count="pinnedItems.length"
        :view-mode="viewMode"
        :search-query="filters.search"
        @open-palette="paletteOpen = true"
        @open-changelog="openChangelog"
        @changeView="viewMode = $event"
        @openFilterModal="filterModalOpen = true"
        @search="filters.search = $event"
      />

      <!-- Router Outlet -->
      <div
        class="router-content flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-1 sm:py-1.5"
      >
        <RouterView class="flex-1 min-h-0" />
      </div>

    </div>

    <!-- Palette Drawer -->
    <PaletteDrawer
      :is-open="paletteOpen"
      :pinned-items="pinnedItems"
      @close="paletteOpen = false"
      @removePin="togglePin({ id: $event })"
      @clearPalette="clearPalette"
      @scrollTo="showPinned"
    />

    <!-- Changelog Modal -->
    <ChangelogModal ref="changelogModal" />

    <!-- Detail Panel Overlay -->
    <div v-if="selectedFilament" class="detail-overlay" @click="selectedFilament = null" />

    <!-- Detail Panel -->
    <FilamentDetailPanel
      :filament="selectedFilament"
      :all-filaments="allFilaments"
      :labels="detailLabels"
      @close="selectedFilament = null"
      @selectFilament="selectFilament"
    />

  </div>
</template>

<script setup lang="ts">
import {readDiscoveryState,saveDiscoveryState} from '../filaman/discovery-state';
import { computed, onMounted, ref, provide, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, RouterView } from "vue-router";
import { useSeo } from "../composables/useSeo";
import { useFilaments } from "../composables/useFilaments";
import AppNavbar from "../components/AppNavbar.vue";
import PaletteDrawer from "../components/PaletteDrawer.vue";
import ChangelogModal from "../components/ChangelogModal.vue";
import { FilamentDetailPanel } from "@/components/filament-detail";
import type { FilamentCard } from "../composables/useFilaments";
const { t, locale } = useI18n();
const router = useRouter();
const { refresh, allFilaments, cachedItems, filters, mode, connectRouter, loadMode, setDiscoveryMode } = useFilaments();

connectRouter(router);

// Shared state for child views
const viewMode = ref<"carousel" | "board">("board");
const pinnedIds = ref(new Set<string>(readDiscoveryState().pins ?? []));
watch(pinnedIds,pins=>saveDiscoveryState({pins:[...pins]}));
const paletteOpen = ref(false);
const selectedFilament = ref<FilamentCard | null>(null);
watch([allFilaments,mode],()=>{if(selectedFilament.value)selectedFilament.value=allFilaments.value.find(item=>item.id===selectedFilament.value?.id)??null;});
const changelogModal = ref<InstanceType<typeof ChangelogModal> | null>(null);
const filterModalOpen = ref(false);

// RGB is now always displayed (no toggle needed)

// Define functions before providing them
let pinSelection = 0;
const selectFilament = (filament: FilamentCard) => {
  pinSelection++;
  selectedFilament.value = filament;
};

const togglePin = (filament: { id: string }) => {
  const next = new Set(pinnedIds.value);
  if (next.has(filament.id)) {
    next.delete(filament.id);
  } else {
    next.add(filament.id);
  }
  pinnedIds.value = next;
};

// Provide state to child views
provide('viewMode', viewMode);
provide('pinnedIds', pinnedIds);
provide('selectedFilament', selectedFilament);
provide('togglePin', togglePin);
provide('selectFilament', selectFilament);
provide('filterModalOpen', filterModalOpen);

// Detail panel labels
const detailLabels = computed(() => ({
  color: t("detail.color"),
  details: t("detail.details"),
  spoolId: t("detail.spoolId"),
  remainingWeight: t("detail.remainingWeight"),
  weight: t("detail.weight"),
  spoolWeight: t("detail.spoolWeight"),
  price: t("detail.price"),
  density: t("detail.density"),
  diameter: t("detail.diameter"),
  extruderTemp: t("detail.extruderTemp"),
  bedTemp: t("detail.bedTemp"),
  articleNumber: t("detail.articleNumber"),
  comment: t("detail.comment"),
  similarColors: t("detail.similarColors"),
  complementaryColors: t("detail.complementaryColors"),
  spools: t("detail.spools"),
  archived: t("detail.archived"),
  remaining: t("detail.remaining"),
  used: t("detail.used"),
  colorHarmonies: t("detail.colorHarmonies"),
  currentColor: t("detail.currentColor"),
  complementary: t("detail.complementary"),
  similar: t("detail.similar"),
}));

const openChangelog = () => {
  changelogModal.value?.open();
};


const clearPalette = () => {
  pinnedIds.value = new Set();
};

const pinnedItems = computed(() => {
  const map = new Map(cachedItems.value.map((f) => [f.id, f]));
  return Array.from(pinnedIds.value)
    .map((id) => map.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
});

watch(
  pinnedItems,
  (items, prev) => {
    if (!items.length) {
      paletteOpen.value = false;
    } else if ((prev?.length ?? 0) === 0 && items.length > 0) {
      paletteOpen.value = true;
    }
  },
  { immediate: true },
);

const showPinned = async (id: string) => {
  const selection = ++pinSelection;
  const target = id.startsWith('color:') ? 'catalog' : 'inventory';
  await setDiscoveryMode(target);
  const item = allFilaments.value.find(entry => entry.id === id);
  if (selection !== pinSelection || !paletteOpen.value || !pinnedIds.value.has(id) || mode.value !== target || !item) return;
  paletteOpen.value = false;
  selectFilament(item);
};

useSeo(
  () => t("seo.title"),
  () => t("seo.description"),
  () => locale.value,
);

onMounted(() => {
  void refresh();
  const other = mode.value === 'catalog' ? 'inventory' : 'catalog';
  const prefix = other === 'catalog' ? 'color:' : 'filament:';
  if ([...pinnedIds.value].some(id => id.startsWith(prefix))) void loadMode(other, false);
});
</script>
