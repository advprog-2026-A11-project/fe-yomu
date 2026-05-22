import { TIERS, DIFFICULTY_LEVELS, type TierKey, type DifficultyKey } from "@/constants";

export function getTierConfig(tier: string): { label: string; order: number; cssClass: string } {
  const key = tier.toLowerCase() as TierKey;
  const config = TIERS[key];
  if (!config) return { label: tier, order: 0, cssClass: "" };

  return {
    label: config.label,
    order: config.order,
    cssClass: `yomu-tier-${key}`,
  };
}

export function getDifficultyConfig(difficulty: string): { label: string; order: number; colorClass: string } {
  const key = difficulty.toUpperCase() as DifficultyKey;
  const config = DIFFICULTY_LEVELS[key];
  if (!config) return { label: difficulty, order: 0, colorClass: "" };

  const colorMap: Record<DifficultyKey, string> = {
    BEGINNER: "text-success",
    INTERMEDIATE: "text-warning",
    ADVANCED: "text-danger",
  };

  return {
    label: config.label,
    order: config.order,
    colorClass: colorMap[key],
  };
}

export function compareTiers(a: string, b: string): number {
  const tierA = getTierConfig(a);
  const tierB = getTierConfig(b);
  return tierA.order - tierB.order;
}

export function isHigherTier(tier: string, than: string): boolean {
  return compareTiers(tier, than) > 0;
}
