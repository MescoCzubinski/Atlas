import type { Bus } from "../../common/bus/bus";
import type { RoutedPath } from "../../common/bus/contracts";
import { DomainException } from "../../common/errors/domain.exception";
import { NoMatchingPlacesException } from "../exceptions/no-matching-places.exception";
import { TimeBudgetTooSmallException } from "../exceptions/time-budget-too-small.exception";
import type { PlaceService } from "./place.service";
import { PlanService } from "./plan.service";
import type { PlaceCandidate, PlannedRoute, RouteQuery } from "./types";

const START = { lat: 51.11, lng: 17.03 };

function place(
  id: string,
  lat: number,
  lng: number,
  tags: PlaceCandidate["tags"],
  extra: Partial<PlaceCandidate> = {},
): PlaceCandidate {
  return {
    id,
    name: `Place ${id}`,
    latitude: lat,
    longitude: lng,
    description: id === "museum" ? "A museum" : null,
    significance: 50,
    tags,
    ...extra,
  };
}

const PLACES: PlaceCandidate[] = [
  place(
    "museum",
    51.112,
    17.032,
    { museum: 90, gothic: 60 },
    {
      significance: 90,
    },
  ),
  place(
    "church",
    51.113,
    17.035,
    { church: 80, gothic: 95 },
    {
      significance: 70,
    },
  ),
  place("far", 51.2, 17.2, { gothic: 99 }, { significance: 100 }),
  place("mural", 51.108, 17.034, { mural: 90 }, { significance: 20 }),
  place(
    "tower",
    51.114,
    17.028,
    { tower: 85, gothic: 75 },
    {
      significance: 60,
    },
  ),
];

function stop(id: string) {
  const p = PLACES.find((x) => x.id === id)!;
  return {
    id,
    name: p.name,
    description: p.description ?? "",
    lat: p.latitude,
    lng: p.longitude,
  };
}

const QUERY: RouteQuery = {
  start: START,
  end: START,
  durationMinutes: 120,
  tags: ["gothic"],
};

class Outside extends DomainException {
  constructor() {
    super("invalid", "outside");
  }
}

function setup(
  walkSecondsPerLeg = 300,
  found: PlaceCandidate[] = PLACES,
  inside = true,
) {
  const findCandidates = jest.fn(async (_query: unknown) => found);
  const route = jest.fn(async (points: unknown[]): Promise<RoutedPath> => ({
    distanceMeters: 1000,
    durationSeconds: (points.length - 1) * walkSecondsPerLeg,
    coordinates: [],
  }));
  const request = jest.fn(
    async (name: string, payload: { points: unknown[] }) => {
      if (name === "location.ensure-inside") {
        if (!inside) throw new Outside();
        return undefined;
      }
      return route(payload.points);
    },
  );
  const service = new PlanService(
    { request } as unknown as Bus,
    { findCandidates } as unknown as PlaceService,
  );
  return { service, route, request, findCandidates };
}

describe("PlanService.plan", () => {
  it("plans the current stops, order and extras", async () => {
    const { service, findCandidates } = setup();
    const { stops, extras } = await service.plan(QUERY);
    expect(findCandidates).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ["gothic"], minPercent: 50, limit: 600 }),
    );
    expect(stops).toEqual([stop("tower"), stop("church"), stop("museum")]);
    expect(extras).toEqual([]);
  });

  it("walks from the start through the stops to the end, routing once when it fits", async () => {
    const { service, route } = setup();
    const end = { lat: 51.111, lng: 17.03 };
    const planned = await service.plan({ ...QUERY, end });
    const points = planned.stops.map(({ lat, lng }) => ({ lat, lng }));
    expect(route).toHaveBeenCalledTimes(1);
    expect(route).toHaveBeenCalledWith([START, ...points, end]);
    expect(planned.path.durationSeconds).toBe((points.length + 1) * 300);
  });

  it("drops stops while the real walk overshoots the budget", async () => {
    const { service, route } = setup(2000);
    const { stops, extras } = await service.plan(QUERY);
    expect(route.mock.calls.length).toBeGreaterThan(1);
    expect(stops).toEqual([stop("church"), stop("museum")]);
    expect(extras).toEqual([stop("tower")]);
  });

  it("refuses a budget shorter than the direct walk", async () => {
    const { service } = setup();
    await expect(
      service.plan({
        ...QUERY,
        end: { lat: 51.2, lng: 17.2 },
        durationMinutes: 15,
      }),
    ).rejects.toThrow(TimeBudgetTooSmallException);
  });

  it("reports no matching places for tags nothing carries", async () => {
    const { service } = setup();
    await expect(service.plan({ ...QUERY, tags: [] })).rejects.toThrow(
      NoMatchingPlacesException,
    );
  });
});

describe("PlanService.build", () => {
  const END = { lat: 51.105, lng: 17.04 };
  const QUERY_TO_END: RouteQuery = { ...QUERY, end: END };

  it("checks the start and end are supported, then plans", async () => {
    const { service, request } = setup();
    const planned: PlannedRoute = {
      stops: [],
      extras: [],
      path: { distanceMeters: 0, durationSeconds: 0, coordinates: [] },
    };
    const plan = jest.spyOn(service, "plan").mockResolvedValue(planned);
    expect(await service.build(QUERY_TO_END)).toBe(planned);
    expect(request).toHaveBeenCalledWith("location.ensure-inside", {
      points: [START, END],
    });
    expect(plan).toHaveBeenCalledWith(QUERY_TO_END);
  });

  it("refuses a start or end outside the supported cities before planning", async () => {
    const { service, route, findCandidates } = setup(300, PLACES, false);
    await expect(service.build(QUERY)).rejects.toThrow(Outside);
    expect(findCandidates).not.toHaveBeenCalled();
    expect(route).not.toHaveBeenCalled();
  });
});

describe("PlanService.selectCandidates", () => {
  const SHORT: RouteQuery = {
    start: START,
    end: START,
    durationMinutes: 60,
    tags: ["gothic", "museum"],
  };
  const near = (
    id: string,
    over: Partial<PlaceCandidate> = {},
  ): PlaceCandidate => ({
    id,
    name: id,
    latitude: 51.112,
    longitude: 17.032,
    description: null,
    significance: 0,
    tags: { gothic: 80 },
    ...over,
  });

  it("asks for candidates in a box the walk can reach", async () => {
    const { service, findCandidates } = setup(300, []);
    await service.selectCandidates(SHORT);
    const query = findCandidates.mock.calls[0]![0] as Record<string, unknown>;
    expect(query).toMatchObject({
      tags: ["gothic", "museum"],
      minPercent: 50,
      limit: 600,
    });
    expect(query.south).toBeLessThan(START.lat);
    expect(query.north).toBeGreaterThan(START.lat);
    expect(query.west).toBeLessThan(START.lng);
    expect(query.east).toBeGreaterThan(START.lng);
  });

  it("does not ask at all without tags", async () => {
    const { service, findCandidates } = setup(300, []);
    expect(await service.selectCandidates({ ...SHORT, tags: [] })).toEqual([]);
    expect(findCandidates).not.toHaveBeenCalled();
  });

  it("values relevance and significance, best first", async () => {
    const { service } = setup(300, [
      near("weak", { tags: { gothic: 55 } }),
      near("strong", { tags: { museum: 95 }, significance: 100 }),
    ]);
    const picked = await service.selectCandidates(SHORT);
    expect(picked.map((c) => c.place.id)).toEqual(["strong", "weak"]);
  });

  it("drops places whose detour does not fit the budget", async () => {
    const { service } = setup(300, [
      near("near"),
      near("far", { latitude: 51.3, longitude: 17.4 }),
    ]);
    const picked = await service.selectCandidates(SHORT);
    expect(picked.map((c) => c.place.id)).toEqual(["near"]);
  });
});
