import type { LatLng } from "./geo";
import type { Plan, PlanStop, RouteCandidate } from "./types";

const IMPROVEMENT_ROUNDS = 3; // insert-then-shorten rounds; stops early when a round adds no stop
const MIN_ADDED_MINUTES = 1; // floor on the time an insertion adds, so a free detour does not divide by zero
const SAME_LENGTH_EPSILON_MINUTES = 0.01; // a reordering must save more than this, so float noise cannot loop

export type PlannerOptions = {
  start: LatLng;
  end: LatLng;
  budgetMinutes: number;
  maxStops: number;
  walkMinutes: (a: LatLng, b: LatLng) => number;
};

type Insertion = { order: RouteCandidate[]; plan: Plan; ratio: number };

export function schedule(
  order: RouteCandidate[],
  o: PlannerOptions,
): Plan | null {
  let minutes = 0;
  let value = 0;
  let prev = o.start;
  const stops: PlanStop[] = [];
  for (const c of order) {
    const w = o.walkMinutes(prev, c.point);
    minutes += w;
    value += c.value;
    stops.push({ candidate: c, walkMinutes: w });
    prev = c.point;
    if (minutes > o.budgetMinutes) return null;
  }
  minutes += o.walkMinutes(prev, o.end);
  if (minutes > o.budgetMinutes) return null;
  return { stops, totalMinutes: minutes, value };
}

export function planOrienteering(
  candidates: RouteCandidate[],
  o: PlannerOptions,
): Plan {
  const cache = new Map<string, number>();
  const memo: PlannerOptions = {
    ...o,
    walkMinutes: (a, b) => {
      const key = `${a.lat},${a.lng}|${b.lat},${b.lng}`;
      let v = cache.get(key);
      if (v === undefined) {
        v = o.walkMinutes(a, b);
        cache.set(key, v);
      }
      return v;
    },
  };
  let order: RouteCandidate[] = [];
  let best = schedule(order, memo) ?? emptyPlan(o);
  for (let round = 0; round < IMPROVEMENT_ROUNDS; round++) {
    const before = order.length;
    for (;;) {
      if (order.length >= o.maxStops) break;
      const pick = bestInsertion(candidates, order, best, memo);
      if (!pick) break;
      order = pick.order;
      best = pick.plan;
    }
    const shortened = shorten(order, best, memo);
    order = shortened.order;
    best = shortened.plan;
    if (order.length === before) break;
  }
  return best;
}

function bestInsertion(
  candidates: RouteCandidate[],
  order: RouteCandidate[],
  best: Plan,
  o: PlannerOptions,
): Insertion | null {
  let pick: Insertion | null = null;
  for (const c of candidates) {
    if (order.includes(c)) continue;
    for (let i = 0; i <= order.length; i++) {
      const next = [...order.slice(0, i), c, ...order.slice(i)];
      const plan = schedule(next, o);
      if (!plan) continue;
      const added = Math.max(
        MIN_ADDED_MINUTES,
        plan.totalMinutes - best.totalMinutes,
      );
      const ratio = (plan.value - best.value) / added;
      if (!pick || ratio > pick.ratio) pick = { order: next, plan, ratio };
    }
  }
  return pick;
}

function shorten(
  start: RouteCandidate[],
  plan: Plan,
  o: PlannerOptions,
): { order: RouteCandidate[]; plan: Plan } {
  let order = start;
  let best = plan;
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < order.length - 1 && !improved; i++) {
      for (let j = i + 1; j < order.length && !improved; j++) {
        const next = [
          ...order.slice(0, i),
          ...order.slice(i, j + 1).reverse(),
          ...order.slice(j + 1),
        ];
        const candidate = schedule(next, o);
        if (
          candidate &&
          candidate.totalMinutes <
            best.totalMinutes - SAME_LENGTH_EPSILON_MINUTES
        ) {
          order = next;
          best = candidate;
          improved = true;
        }
      }
    }
  }
  return { order, plan: best };
}

function emptyPlan(o: PlannerOptions): Plan {
  return { stops: [], totalMinutes: o.walkMinutes(o.start, o.end), value: 0 };
}
