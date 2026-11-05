import type { WalkingPath } from "@/api/types";

export function walkingMinutes(path: WalkingPath) {
  return Math.round(path.durationSeconds / 60);
}
