export type PlanTierId = "basic" | "core_learner" | "pro_companion";

export type PricingCtaVariant = "free" | "paid";

export interface PlanTier {
  id: PlanTierId;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: PricingCtaVariant;
  /** Max custom companions; `null` = unlimited */
  companionLimit: number | null;
  /** Max voice minutes per calendar month; `null` = unlimited */
  monthlyMinutes: number | null;
  /** Max PDF documents per companion; `null` = unlimited; `0` = none */
  documentLimitPerCompanion: number | null;
}

/**
 * Marketing + app limits. Names/prices align with Clerk PricingTable:
 * Basic Plan, Core Learner ($29/mo), Pro Companion ($49/mo).
 *
 * Clerk feature flags used in code:
 * - `3_companion_limit` → Core Learner
 * - `10_companion_limit` → extended Core (10 companions, 300 min)
 * - plan `pro` or `pro_companion` → Pro Companion
 */
export const PLAN_TIERS: PlanTier[] = [
  {
    id: "basic",
    name: "Basic Plan",
    price: "$0",
    period: "always free",
    description: "Explore voice tutoring and the public companion library.",
    features: [
      "Browse public companions",
      "Voice sessions with available tutors",
      "60 voice minutes per month",
      "Session transcripts when saved",
    ],
    highlighted: false,
    cta: "free",
    companionLimit: 0,
    monthlyMinutes: 60,
    documentLimitPerCompanion: 0,
  },
  {
    id: "core_learner",
    name: "Core Learner",
    price: "$29",
    period: "per month",
    description: "Create personal AI tutors and track your learning progress.",
    features: [
      "Up to 3 custom companions",
      "120 voice minutes per month",
      "Full voice session history",
      "AI summary & quiz after sessions",
      "My Journey analytics",
    ],
    highlighted: true,
    cta: "paid",
    companionLimit: 3,
    monthlyMinutes: 120,
    documentLimitPerCompanion: 3,
  },
  {
    id: "pro_companion",
    name: "Pro Companion",
    price: "$49",
    period: "per month",
    description: "For power learners who want unlimited companions and practice time.",
    features: [
      "Unlimited custom companions",
      "Unlimited voice minutes",
      "Everything in Core Learner",
      "Priority for future pro features",
      "Best for heavy daily practice",
    ],
    highlighted: false,
    cta: "paid",
    companionLimit: null,
    monthlyMinutes: null,
    documentLimitPerCompanion: null,
  },
];

export function getPlanTierById(id: PlanTierId): PlanTier {
  const tier = PLAN_TIERS.find((plan) => plan.id === id);
  if (!tier) throw new Error(`Unknown plan tier: ${id}`);
  return tier;
}
