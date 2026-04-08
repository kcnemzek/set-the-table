export const STORES = [
  "Aldi",
  "Food Lion",
  "Harris Teeter",
  "Lowes Food",
  "Publix",
] as const;

export type StoreName = (typeof STORES)[number];
