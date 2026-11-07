import { Injectable } from "@nestjs/common";
import { PlaceRepository } from "../repositories/place.repository";
import type { CandidateQuery, PlaceCandidate, PlaceView } from "./types";

export const MAX_RESULTS = 8;

export function toPlaceView(p: PlaceCandidate): PlaceView {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    lat: p.latitude,
    lng: p.longitude,
  };
}

@Injectable()
export class PlaceService {
  constructor(private readonly places: PlaceRepository) {}

  async search(query: string): Promise<PlaceView[]> {
    const found = await this.places.findByName(query.trim(), MAX_RESULTS);
    return found.map(toPlaceView);
  }

  findCandidates(query: CandidateQuery): Promise<PlaceCandidate[]> {
    return this.places.findInBoxWithTags(query);
  }
}
