<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 overflow-y-auto"
      @click="$emit('close')"
    >
      <div
        class="bg-[rgb(var(--surface))] rounded-lg max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between gap-4 px-6 py-4 border-b border-[var(--border)]">
          <h2 class="text-lg font-semibold text-[rgb(var(--text))]">{{ t('filters.filter') }}</h2>
          <button
            @click="$emit('close')"
            class="p-1 hover:bg-[var(--border)] rounded transition text-[rgb(var(--text-muted))]"
          >
            <Icon icon="lucide:x" class="w-5 h-5" />
          </button>
        </div>

        <!-- Content (Scrollable) -->
        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <!-- Vendor Filter -->
          <section v-if="vendorOptions.length > 0">
            <h3 class="text-sm font-semibold text-[rgb(var(--text))] mb-3 uppercase tracking-wider">
              {{ t('filters.vendor') }}
            </h3>
            <div class="space-y-2">
              <label class="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="vendor"
                  value="all"
                  v-model="filters.vendor"
                  class="rounded-full text-[rgb(var(--accent-rgb))]"
                />
                <span class="text-sm text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent-rgb))]">
                  {{ t('filters.all') }}
                </span>
              </label>
              <label
                v-for="vendor in vendorOptions"
                :key="vendor"
                class="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="vendor"
                  :value="vendor"
                  v-model="filters.vendor"
                  class="rounded-full text-[rgb(var(--accent-rgb))]"
                />
                <span class="text-sm text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent-rgb))]">
                  {{ vendor }}
                </span>
              </label>
            </div>
          </section>

          <!-- Material Filter -->
          <section v-if="materialOptions.length > 0">
            <h3 class="text-sm font-semibold text-[rgb(var(--text))] mb-3 uppercase tracking-wider">
              {{ t('filters.material') }}
            </h3>
            <div class="space-y-2">
              <label class="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="material"
                  value="all"
                  v-model="filters.material"
                  class="rounded-full text-[rgb(var(--accent-rgb))]"
                />
                <span class="text-sm text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent-rgb))]">
                  {{ t('filters.all') }}
                </span>
              </label>
              <label
                v-for="material in materialOptions"
                :key="material"
                class="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="material"
                  :value="material"
                  v-model="filters.material"
                  class="rounded-full text-[rgb(var(--accent-rgb))]"
                />
                <span class="text-sm text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent-rgb))]">
                  {{ material }}
                </span>
              </label>
            </div>
          </section>

          <!-- Location Filter -->
          <section v-if="locationOptions.length > 0">
            <h3 class="text-sm font-semibold text-[rgb(var(--text))] mb-3 uppercase tracking-wider">
              {{ t('filters.location') }}
            </h3>
            <div class="space-y-2">
              <label class="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="location"
                  value="all"
                  v-model="filters.location"
                  class="rounded-full text-[rgb(var(--accent-rgb))]"
                />
                <span class="text-sm text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent-rgb))]">
                  {{ t('filters.all') }}
                </span>
              </label>
              <label
                v-for="location in locationOptions"
                :key="location"
                class="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="location"
                  :value="location"
                  v-model="filters.location"
                  class="rounded-full text-[rgb(var(--accent-rgb))]"
                />
                <span class="text-sm text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent-rgb))]">
                  {{ location }}
                </span>
              </label>
            </div>
          </section>

          <section v-if="mode !== 'catalog'"><label>{{ t('filters.inventoryScope') }}<select v-model="filters.inventoryScope"><option value="filaments">{{ t('filters.filamentsOnly') }}</option><option value="all_spools">{{ t('filters.allSpoolsOnly') }}</option><option value="on_hand_spools">{{ t('filters.onHandSpoolsOnly') }}</option></select></label></section>
          <!-- Color Type Filter -->
          <section v-if="mode !== 'catalog'">
            <h3 class="text-sm font-semibold text-[rgb(var(--text))] mb-3 uppercase tracking-wider">
              {{ t('filters.colorType') }}
            </h3>
            <div class="space-y-2">
              <label class="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="colorType"
                  value="all"
                  v-model="filters.colorType"
                  class="rounded-full text-[rgb(var(--accent-rgb))]"
                />
                <span class="text-sm text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent-rgb))]">
                  {{ t('filters.all') }}
                </span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="colorType"
                  value="single"
                  v-model="filters.colorType"
                  class="rounded-full text-[rgb(var(--accent-rgb))]"
                />
                <span class="text-sm text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent-rgb))]">
                  {{ t('filters.singleColor') }}
                </span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="colorType"
                  value="multi"
                  v-model="filters.colorType"
                  class="rounded-full text-[rgb(var(--accent-rgb))]"
                />
                <span class="text-sm text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent-rgb))]">
                  {{ t('filters.multiColor') }}
                </span>
              </label>
            </div>
          </section>
        </div>

        <!-- Footer -->
        <div class="flex gap-3 px-6 py-4 border-t border-[var(--border)]">
          <button
            @click="resetFilters"
            class="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-[rgb(var(--text))] hover:bg-[var(--border)] transition text-sm font-medium"
          >
            {{ t('actions.reset') }}
          </button>
          <button
            @click="applyFilters"
            class="flex-1 px-4 py-2 rounded-lg bg-[rgb(var(--accent-rgb))] text-white hover:opacity-90 transition text-sm font-medium"
          >
            {{ t('actions.save') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Icon } from '@iconify/vue';
import type {DiscoveryFilters} from '@/composables/useFilaments';

type FilterState=Pick<DiscoveryFilters,'vendor'|'material'|'location'|'source'|'colorType'|'inventoryScope'>;

const props = defineProps<{
  mode?: string;
  isOpen: boolean;
  initialFilters: FilterState;
  vendorOptions: string[];
  materialOptions: string[];
  locationOptions: string[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'apply', filters: FilterState): void;
}>();

const { t } = useI18n();

const filters = ref<FilterState>({ ...props.initialFilters });

watch(() => props.initialFilters, (newFilters) => {
  filters.value = { ...newFilters };
}, { deep: true });

const resetFilters = () => {
  filters.value = {
    vendor: 'all',
    material: 'all',
    location: 'all',
    source: 'filaman',
    colorType: 'all',
    inventoryScope:'filaments',
  };
};

const applyFilters = () => {
  emit('apply', filters.value);
  emit('close');
};
</script>

<style scoped>
input[type='radio'] {
  cursor: pointer;
}
</style>
