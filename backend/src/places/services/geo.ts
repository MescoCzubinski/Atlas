export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_000;
const WALKING_SPEED_KMH = 4.5;

/** Streets are not straight: a walk is about this much longer than the straight line. */
export const DETOUR_FACTOR = 1.3;
export const WALKING_METERS_PER_MINUTE = (WALKING_SPEED_KMH * 1000) / 60;
export const METERS_PER_DEGREE_LAT = (Math.PI / 180) * EARTH_RADIUS_M;

export const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Estimated walking time: the great-circle distance stretched by the detour factor. */
export function walkMinutes(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(dLng / 2) ** 2;
  const meters = 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
  return (meters * DETOUR_FACTOR) / WALKING_METERS_PER_MINUTE;
}
