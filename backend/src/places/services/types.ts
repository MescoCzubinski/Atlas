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
  mainImageUrl: string | null;
  significance: number;
  tags: TagPercents;
};

export type RouteQuery = {
  start: LatLng;
  end: LatLng;
  durationMinutes: number;
  tags: StyleTag[];
};

export type PlannedStop = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  imageUrl?: string | null;
};

export type PlannedRoute = {
  stops: PlannedStop[];
  extras: PlannedStop[];
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
