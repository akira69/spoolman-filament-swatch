import { computed, type Ref } from 'vue';
import { colorDistance, getHue, hueDifference } from '@/lib/colorUtils';
import type { FilamentCard } from './useFilaments';

export type ColorHarmonyResult = FilamentCard & { distance: number };

export function useColorHarmonies(
  filament: Ref<FilamentCard | null>,
  allFilaments: Ref<FilamentCard[]>
) {
  const similarColors = computed((): ColorHarmonyResult[] => {
    if (!filament.value) return [];

    const currentHex = filament.value.colorHex;

    return allFilaments.value
      .filter(f => f.id !== filament.value!.id)
      .map(f => ({
        ...f,
        distance: colorDistance(currentHex, f.colorHex),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  });

  const complementaryColors = computed((): ColorHarmonyResult[] => {
    if (!filament.value) return [];

    const currentHue = getHue(filament.value.colorHex);
    const complementaryHue = (currentHue + 180) % 360;

    return allFilaments.value
      .filter(f => f.id !== filament.value!.id)
      .map(f => {
        const fHue = getHue(f.colorHex);
        const distance = hueDifference(fHue, complementaryHue);
        return { ...f, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  });

  const hues = computed(() => allFilaments.value.map(item => ({item, hue:getHue(item.colorHex)})));

  const findClosest = (targetHue: number): ColorHarmonyResult | undefined => {
    let closest: FilamentCard | undefined;
    let distance = Infinity;
    for (const {item, hue} of hues.value) {
      if (item.id === filament.value?.id) continue;
      const candidate = hueDifference(hue, targetHue);
      if (candidate < distance) {
        closest = item;
        distance = candidate;
      }
    }
    return closest && { ...closest, distance };
  };

  const analogousColors = computed((): (ColorHarmonyResult | undefined)[] => {
    if (!filament.value) return [];

    const currentHue = getHue(filament.value.colorHex);
    const analogHue1 = (currentHue + 30) % 360;
    const analogHue2 = (currentHue - 30 + 360) % 360;


    return [findClosest(analogHue1), findClosest(analogHue2)].filter(Boolean);
  });

  const splitComplementaryColors = computed((): (ColorHarmonyResult | undefined)[] => {
    if (!filament.value) return [];

    const currentHue = getHue(filament.value.colorHex);
    const splitHue1 = (currentHue + 150) % 360;
    const splitHue2 = (currentHue + 210) % 360;


    return [findClosest(splitHue1), findClosest(splitHue2)].filter(Boolean);
  });

  const triadColors = computed((): FilamentCard[] => {
    if (!filament.value) return [];

    const currentHue = getHue(filament.value.colorHex);
    const triadHue1 = (currentHue + 120) % 360;
    const triadHue2 = (currentHue + 240) % 360;


    const colors = [
      filament.value,
      findClosest(triadHue1),
      findClosest(triadHue2),
    ].filter(Boolean) as FilamentCard[];

    return colors.length === 3 ? colors : [];
  });

  const isComplementary = (item: FilamentCard): boolean => {
    if (!filament.value) return false;
    return complementaryColors.value.some(c => c.id === item.id);
  };

  const isSimilar = (item: FilamentCard): boolean => {
    if (!filament.value) return false;
    return similarColors.value.some(c => c.id === item.id);
  };

  const isAnalogous = (item: FilamentCard): boolean => {
    if (!filament.value) return false;
    return analogousColors.value.some(c => c?.id === item.id);
  };

  const isSplitComplementary = (item: FilamentCard): boolean => {
    if (!filament.value) return false;
    return splitComplementaryColors.value.some(c => c?.id === item.id);
  };

  const isTriadic = (item: FilamentCard): boolean => {
    if (!filament.value) return false;
    return triadColors.value.some(c => c?.id === item.id);
  };

  return {
    similarColors,
    complementaryColors,
    analogousColors,
    splitComplementaryColors,
    triadColors,
    isComplementary,
    isSimilar,
    isAnalogous,
    isSplitComplementary,
    isTriadic,
  };
}
