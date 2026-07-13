export type PlacementLevel = "beginner" | "intermediate" | "advanced";

export function scoreToLevel(score: number, total: number): PlacementLevel {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.8) return "advanced";
  if (ratio >= 0.5) return "intermediate";
  return "beginner";
}
