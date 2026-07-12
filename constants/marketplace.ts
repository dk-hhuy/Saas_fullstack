export const MARKETPLACE_TAGS = [
  "exam-prep",
  "language",
  "coding",
  "science",
  "business",
  "kids",
  "advanced",
] as const;

export type MarketplaceTag = (typeof MARKETPLACE_TAGS)[number];

export const MAX_COMPANION_TAGS = 5;

export const MARKETPLACE_STATUSES = [
  "none",
  "pending",
  "approved",
  "rejected",
] as const;

export type MarketplaceStatus = (typeof MARKETPLACE_STATUSES)[number];
