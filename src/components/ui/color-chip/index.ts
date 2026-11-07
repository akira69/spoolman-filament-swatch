export { default as ColorChip } from './ColorChip.vue';
export { default as ColorChipList } from './ColorChipList.vue';
export interface ColorChipItem {
  id: string;
  colorHex: string;
  name: string;
  vendor?: string|null;
  source: string;
  multiColorHexes?:string[];
  multiColorDirection?:'coaxial'|'longitudinal';
  nativeColorStyle?:'striped'|'gradient';
}
