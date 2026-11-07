import { Injectable, Logger } from "@nestjs/common";
import type { RoutedPath } from "../../common/bus/contracts";
import { Bus } from "../../common/bus/bus";
import { NoMatchingPlacesException } from "../exceptions/no-matching-places.exception";
import { TimeBudgetTooSmallException } from "../exceptions/time-budget-too-small.exception";
import {
  DETOUR_FACTOR,
  METERS_PER_DEGREE_LAT,
  toRadians,
  walkMinutes,
  WALKING_METERS_PER_MINUTE,
} from "./geo";
import { planOrienteering, type PlannerOptions } from "./orienteering";
import { PlaceService, toPlaceView } from "./place.service";
import type {
  Plan,
  PlaceCandidate,
  PlannedRoute,
  RouteCandidate,
  RouteQuery,
} from "./types";

const MIN_TAG_PERCENT = 50; // a place counts for a tag from this percent up
const MAX_PLACES_READ = 600; // places read from the reachable box, most significant first
const MAX_CANDIDATES = 120; // best-valued places handed to the planner, to keep it fast
const MAX_STOPS = 60; // a safety bound; the time budget decides how many stops fit
const MAX_EXTRAS = 10; // runner-up places offered for adding by hand
const MAX_REFINEMENTS = 3; // re-plans while the real walk is longer than the estimate
const SECONDS_PER_MINUTE = 60;

const MAX_SIGNIFICANCE = 100; // places.significance runs from 0 to 100
const MIN_NOTABILITY = 0.5; // weight of a place with significance 0; the most significant weighs 1

@Injectable()
export class PlanService {
  private readonly log = new Logger(PlanService.name);

  constructor(
    private readonly bus: Bus,
    private readonly places: PlaceService,
  ) {}

  async build(query: RouteQuery): Promise<PlannedRoute> {
    await this.bus.request("location.ensure-inside", {
      points: [query.start, query.end],
    });
    return this.plan(query);
  }

  async plan(query: RouteQuery): Promise<PlannedRoute> {
    const direct = walkMinutes(query.start, query.end);
    if (direct > query.durationMinutes)
      throw new TimeBudgetTooSmallException(direct);

    const candidates = await this.selectCandidates(query);
    if (candidates.length === 0) throw new NoMatchingPlacesException();

    const options: PlannerOptions = {
      start: query.start,
      end: query.end,
      budgetMinutes: query.durationMinutes,
      maxStops: MAX_STOPS,
      walkMinutes,
    };
    let plan = planOrienteering(candidates, options);
    if (plan.stops.length === 0) throw new NoMatchingPlacesException();

    let path = await this.route(query, plan);
    for (
      let attempt = 0;
      attempt < MAX_REFINEMENTS &&
      plan.stops.length > 1 &&
      path.durationSeconds / SECONDS_PER_MINUTE > query.durationMinutes;
      attempt++
    ) {
      this.log.debug(
        `real walk ${Math.round(path.durationSeconds / SECONDS_PER_MINUTE)} min overshoots, dropping a stop`,
      );
      const drop = this.weakest(plan);
      plan = planOrienteering(
        candidates.filter((c) => c !== drop),
        { ...options, maxStops: plan.stops.length - 1 },
      );
      path = await this.route(query, plan);
    }
    const chosen = new Set(plan.stops.map((s) => s.candidate));
    return {
      stops: plan.stops.map((s) => toPlaceView(s.candidate.place)),
      extras: candidates
        .filter((c) => !chosen.has(c))
        .slice(0, MAX_EXTRAS)
        .map((c) => toPlaceView(c.place)),
      path,
    };
  }

  async selectCandidates(query: RouteQuery): Promise<RouteCandidate[]> {
    if (query.tags.length === 0) return [];
    const box = this.reachableBox(query);
    const found = await this.places.findCandidates({
      ...box,
      tags: query.tags,
      minPercent: MIN_TAG_PERCENT,
      limit: MAX_PLACES_READ,
    });
    return found
      .map((p) => this.toCandidate(p, query))
      .filter((c): c is RouteCandidate => c !== null)
      .filter((c) => this.detourFits(c, query))
      .sort((a, b) => b.value - a.value)
      .slice(0, MAX_CANDIDATES);
  }

  private route(query: RouteQuery, plan: Plan): Promise<RoutedPath> {
    return this.bus.request("directions.route", {
      points: [
        query.start,
        ...plan.stops.map((s) => s.candidate.point),
        query.end,
      ],
    });
  }

  private toCandidate(
    p: PlaceCandidate,
    query: RouteQuery,
  ): RouteCandidate | null {
    let relevance = 0;
    for (const tag of query.tags) {
      const percent = p.tags[tag] ?? 0;
      if (percent >= MIN_TAG_PERCENT)
        relevance = Math.max(relevance, percent / 100);
    }
    if (relevance === 0) return null;

    const notability =
      MIN_NOTABILITY +
      (1 - MIN_NOTABILITY) * (p.significance / MAX_SIGNIFICANCE);
    return {
      place: p,
      point: { lat: p.latitude, lng: p.longitude },
      value: relevance * notability,
    };
  }

  private detourFits(c: RouteCandidate, query: RouteQuery): boolean {
    const there = walkMinutes(query.start, c.point);
    const back = walkMinutes(c.point, query.end);
    return there + back <= query.durationMinutes;
  }

  /**
   * A stop fits when walking start → stop → end takes no longer than the budget: an ellipse
   * around the start–end midpoint whose semi-major axis is half the straight-line distance
   * walkable in the budget. This box bounds that ellipse.
   */
  private reachableBox(query: RouteQuery) {
    const reachMeters =
      (query.durationMinutes * WALKING_METERS_PER_MINUTE) / DETOUR_FACTOR / 2;
    const centre = {
      lat: (query.start.lat + query.end.lat) / 2,
      lng: (query.start.lng + query.end.lng) / 2,
    };
    const dLat = reachMeters / METERS_PER_DEGREE_LAT;
    const dLng = dLat / Math.cos(toRadians(centre.lat));
    return {
      south: centre.lat - dLat,
      north: centre.lat + dLat,
      west: centre.lng - dLng,
      east: centre.lng + dLng,
    };
  }

  private weakest(plan: Plan): RouteCandidate {
    return plan.stops.reduce((worst, s) =>
      s.candidate.value / s.walkMinutes <
      worst.candidate.value / worst.walkMinutes
        ? s
        : worst,
    ).candidate;
  }
}
