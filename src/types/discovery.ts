export type DiscoveryMode = 'inventory' | 'catalog';
export type DiscoveryColor = { nativeId: number; position: number; hex: string; name: string };
export type NativeSpoolSummary = {
  id: number; href: string; archived: boolean; onHand: boolean;
  location: string | null; remainingPercent: number | null; remainingWeightG: number | null;
};
type DiscoveryBase = {
  id: string; nativeId: number; name: string; colors: DiscoveryColor[];
  colorHex: string; colorName: string; source: 'filaman';
  multiColorHexes?: string[];
};
export type CatalogItem = DiscoveryBase & { kind: 'catalog'; usageCount: number };
export type InventoryItem = DiscoveryBase & {
  kind: 'inventory'; vendor: string | null; logoUrl: string | null; material: string;
  nativeColorStyle: 'striped' | 'gradient'; price: number | null; priceCurrency: string | null;
  weight: number | null; spoolWeight: number | null; density: number | null; diameter: number | null;
  articleNumber: string | null; spools: NativeSpoolSummary[];
};
export type DiscoveryItem = InventoryItem | CatalogItem;
export type InventorySnapshot = {items: InventoryItem[]};
export type CatalogSnapshot = {items: CatalogItem[]; etag?: string};
