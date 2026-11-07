<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Icon } from '@iconify/vue';
import { Button } from '@/components/ui/button';


defineProps<{
  pinnedCount: number;
  searchQuery: string;
  viewMode?: 'board' | 'carousel';
}>();

const emit = defineEmits<{
  (e: 'openPalette'): void;
  (e: 'openChangelog'): void;
  (e: 'changeView', mode: 'board' | 'carousel'): void;
  (e: 'openFilterModal'): void;
  (e: 'search', query: string): void;
}>();

const { t } = useI18n();
const inFilamanShell=window.parent!==window && !!window.parent.document.getElementById('sidebar-toggle');

const mobileMenuOpen = ref(false);
const appTitle = computed(() => t('app.hostedTitle'));


const handleOpenChangelog = () => {
  emit('openChangelog');
  mobileMenuOpen.value = false;
};

const handleSearch = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit('search', target.value);
};

</script>

<template>
  <nav :class="{'in-filaman-shell':inFilamanShell}" class="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgb(var(--surface))] shadow-sm">
    <div class="app-navbar-inner px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
      <div class="app-brand flex shrink-0 items-center gap-2">
        <Icon icon="lucide:palette" class="w-5 h-5 text-[rgb(var(--accent-rgb))]" />
        <span class="hidden sm:inline font-semibold text-[rgb(var(--text))] text-base">{{ appTitle }}</span>
      </div>

      <div class="flex-1 min-w-0 max-w-md">
        <div class="relative">
          <Icon icon="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))]" />
          <input
            type="text"
            :value="searchQuery"
            :placeholder="t('search.placeholder')"
            class="w-full bg-[rgb(var(--bg))] border border-[var(--border)] rounded-lg pl-9 pr-4 py-1.5 sm:py-2 text-sm text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-rgb))]"
            @input="handleSearch"
          />
        </div>
      </div>

      <!-- Right: Controls -->
      <div class="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <!-- Filter Button -->
        <button
          @click="$emit('openFilterModal')"
          class="p-2 rounded-lg hover:bg-[var(--border)] transition text-[rgb(var(--text))] flex items-center gap-1.5"
          :title="t('filters.filter')"
        >
          <Icon icon="lucide:sliders-horizontal" class="w-5 h-5" />
          <span class="hidden sm:inline text-sm">{{ t('filters.filter') || 'Filters' }}</span>
        </button>

        <!-- View Toggle -->
        <div class="flex items-center gap-1 bg-[rgb(var(--bg))] rounded-lg p-1">
          <button
            :class="[
              'p-1.5 rounded transition',
              viewMode === 'board'
                ? 'bg-[rgb(var(--accent-rgb))] text-white'
                : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]'
            ]"
            @click="$emit('changeView', 'board')"
            :title="t('actions.viewBoard')"
          >
            <Icon icon="lucide:layout-grid" class="w-4 h-4" />
          </button>
          <button
            :class="[
              'p-1.5 rounded transition',
              viewMode === 'carousel'
                ? 'bg-[rgb(var(--accent-rgb))] text-white'
                : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]'
            ]"
            @click="$emit('changeView', 'carousel')"
            :title="t('actions.viewCarousel')"
          >
            <Icon icon="lucide:gallery-horizontal" class="w-4 h-4" />
          </button>
        </div>

        <!-- Desktop: Palette button -->
        <Button
          size="sm"
          variant="outline"
          @click="emit('openPalette')"
          class="relative h-8 sm:h-9 w-8 sm:w-9 p-0 hidden sm:flex"
          :aria-label="t('actions.openPalette')"
        >
          <Icon icon="lucide:bookmark" class="w-4 h-4" />
          <span
            v-if="pinnedCount > 0"
            class="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(var(--accent-rgb))] text-white text-[10px] font-bold shadow-lg border-2 border-[rgb(var(--surface))]"
          >
            {{ pinnedCount }}
          </span>
        </Button>

        <!-- Desktop: Changelog -->
        <Button
          size="sm"
          variant="outline"
          @click="emit('openChangelog')"
          class="h-8 sm:h-9 w-8 sm:w-9 p-0 hidden sm:flex"
          aria-label="What's New"
        >
          <Icon icon="lucide:sparkles" class="w-4 h-4" />
        </Button>

        <!-- Mobile: Menu button -->
        <div class="sm:hidden relative">
          <Button
            size="sm"
            variant="outline"
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="h-8 w-8 p-0"
            :aria-label="'Menu'"
          >
            <Icon icon="lucide:more-vertical" class="w-4 h-4" />
          </Button>
          <!-- Mobile Menu Dropdown -->
          <Transition name="fade">
            <div v-if="mobileMenuOpen">
              <div class="fixed inset-0 z-40" @click="mobileMenuOpen = false"></div>
              <div class="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-[rgb(var(--surface))] shadow-lg z-50">
                <div class="p-2 flex flex-col gap-1">
                  <hr class="border-[var(--border)]/50 my-1" />
                  <button
                    class="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--border)] rounded-md transition-colors"
                    @click="handleOpenChangelog"
                  >
                    <Icon icon="lucide:sparkles" class="w-4 h-4" />
                    {{ t('changelog.title') || 'What\'s New' }}
                  </button>
                  <a
                    href="https://github.com/sponsors/Disane87"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-2 px-3 py-2 text-sm text-pink-500 hover:bg-[var(--border)] rounded-md transition-colors"
                    @click="mobileMenuOpen = false"
                  >
                    <Icon icon="lucide:heart" class="w-4 h-4" />
                    {{ t('actions.sponsor') }}
                  </a>
                  <hr class="border-[var(--border)]/50 my-1" />
                  <button
                    class="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--border)] rounded-md transition-colors w-full"
                    @click="$emit('openFilterModal'); mobileMenuOpen = false"
                  >
                    <Icon icon="lucide:sliders-horizontal" class="w-4 h-4" />
                    {{ t('filters.filter') || 'Filters' }}
                  </button>
                  <button
                    class="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--border)] rounded-md transition-colors w-full relative"
                    @click="$emit('openPalette'); mobileMenuOpen = false"
                  >
                    <Icon icon="lucide:bookmark" class="w-4 h-4" />
                    {{ t('info.palette') || 'Palette' }}
                    <span
                      v-if="pinnedCount > 0"
                      class="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(var(--accent-rgb))] text-white text-[10px] font-bold"
                    >
                      {{ pinnedCount }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (max-width:599px) {
  .in-filaman-shell .app-navbar-inner {padding-left:52px;}
  .in-filaman-shell .app-brand {display:none;}
}
</style>
