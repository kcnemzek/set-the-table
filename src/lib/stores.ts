export const STORES = [
  "Aldi",
  "Food Lion",
  "Harris Teeter",
  "Lowes Food",
  "Publix",
  "Walmart"
] as const;

export type StoreName = (typeof STORES)[number];
