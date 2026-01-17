export const FOLLOW_TARGET_TYPES = [
  "jurisdiction",
  "entity",
  "issue",
  "user",
] as const;

export type FollowTargetType = (typeof FOLLOW_TARGET_TYPES)[number];

export function isFollowTargetType(value: string): value is FollowTargetType {
  return FOLLOW_TARGET_TYPES.includes(value as FollowTargetType);
}
