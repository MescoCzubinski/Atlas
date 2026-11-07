import type { RoutedPath } from "../../common/bus/contracts";
import type { StyleTag } from "../../common/types/style-tag";
import type { LatLng } from "./geo";

export type TagPercents = Partial<Record<StyleTag, number>>;

export type CandidateQuery = {
  south: number;
  west: number;
  north: number;
  east: number;
  tags: StyleTag[];
  minPercent: number;
  limit: number;
};

export type PlaceCandidate = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string | null;
  significance: number;
  tags: TagPercents;
};

/** A place as the API returns it, in search results and in a planned route. */
export type PlaceView = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
};

export type RouteQuery = {
  start: LatLng;
  end: LatLng;
  durationMinutes: number;
  tags: StyleTag[];
};

export type PlannedRoute = {
  stops: PlaceView[];
  extras: PlaceView[];
  path: RoutedPath;
};

export type RouteCandidate = {
  place: PlaceCandidate;
  point: LatLng;
  value: number;
};

export type PlanStop = {
  candidate: RouteCandidate;
  walkMinutes: number;
};

export type Plan = {
  stops: PlanStop[];
  totalMinutes: number;
  value: number;
};
