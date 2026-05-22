export const TIERS = {
  bronze: { label: "Bronze", order: 1 },
  silver: { label: "Silver", order: 2 },
  gold: { label: "Gold", order: 3 },
  platinum: { label: "Platinum", order: 4 },
  diamond: { label: "Diamond", order: 5 },
} as const;

export type TierKey = keyof typeof TIERS;

export const DIFFICULTY_LEVELS = {
  BEGINNER: { label: "Beginner", order: 1 },
  INTERMEDIATE: { label: "Intermediate", order: 2 },
  ADVANCED: { label: "Advanced", order: 3 },
} as const;

export type DifficultyKey = keyof typeof DIFFICULTY_LEVELS;

export const ROLES = {
  ADMIN: "ADMIN",
  STUDENT: "STUDENT",
} as const;

export type RoleKey = keyof typeof ROLES;

export const MAX_SHOWCASE_ACHIEVEMENTS = 3;

export const DEFAULT_PAGE_SIZE = 20;
