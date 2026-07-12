import { auth } from "@clerk/nextjs/server";
import {
  getPlanTierById,
  type PlanTierId,
} from "@/constants/plans";

/** Clerk plan slugs / features — keep in sync with Clerk Dashboard → Billing */
const PRO_PLAN_SLUGS = ["pro_companion", "pro"] as const;
const CORE_PLAN_SLUGS = ["core_learner"] as const;

export async function resolvePlanTierId(): Promise<PlanTierId> {
  const { has } = await auth();

  for (const slug of PRO_PLAN_SLUGS) {
    if (has({ plan: slug })) return "pro_companion";
  }

  if (has({ feature: "10_companion_limit" }) || has({ feature: "3_companion_limit" })) {
    return "core_learner";
  }

  for (const slug of CORE_PLAN_SLUGS) {
    if (has({ plan: slug })) return "core_learner";
  }

  return "basic";
}

export async function getCompanionLimit(): Promise<number | null> {
  const { has } = await auth();

  for (const slug of PRO_PLAN_SLUGS) {
    if (has({ plan: slug })) return null;
  }

  if (has({ feature: "10_companion_limit" })) return 10;
  if (has({ feature: "3_companion_limit" })) return 3;

  return getPlanTierById("basic").companionLimit;
}

export async function getMonthlyMinuteLimit(): Promise<number | null> {
  const { has } = await auth();

  for (const slug of PRO_PLAN_SLUGS) {
    if (has({ plan: slug })) return null;
  }

  if (has({ feature: "10_companion_limit" })) return 300;
  if (has({ feature: "3_companion_limit" })) return 120;

  return getPlanTierById("basic").monthlyMinutes;
}

export async function getDocumentLimitPerCompanion(): Promise<number | null> {
  const tierId = await resolvePlanTierId();
  return getPlanTierById(tierId).documentLimitPerCompanion;
}

export async function canUploadDocuments(): Promise<boolean> {
  const limit = await getDocumentLimitPerCompanion();
  return limit === null || limit > 0;
}

export async function getPlanDisplayName(): Promise<string> {
  const tierId = await resolvePlanTierId();
  return getPlanTierById(tierId).name;
}

export async function canCreateMoreCompanions(
  currentCount: number
): Promise<boolean> {
  const limit = await getCompanionLimit();
  if (limit === null) return true;
  return currentCount < limit;
}

/** Max classrooms a teacher can create; `null` = unlimited; `0` = none */
export async function getClassroomLimit(): Promise<number | null> {
  const tierId = await resolvePlanTierId();
  if (tierId === "pro_companion") return null;
  if (tierId === "core_learner") return 1;
  return 0;
}

export async function canCreateMoreClassrooms(
  currentCount: number
): Promise<boolean> {
  const limit = await getClassroomLimit();
  if (limit === null) return true;
  return currentCount < limit;
}
