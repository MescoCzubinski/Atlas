type LatLng = { lat: number; lng: number };

export type RoutedPath = {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: LatLng[];
};

export type Requests = {
  "location.ensure-inside": { payload: { points: LatLng[] }; reply: void };
  "directions.route": { payload: { points: LatLng[] }; reply: RoutedPath };
};
