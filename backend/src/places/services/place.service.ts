import { Injectable } from "@nestjs/common";
import {
  PlaceRepository,
  type PlaceRow,
} from "../repositories/place.repository";
import type { CandidateQuery, PlaceCandidate } from "./types";

export type PlaceView = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
};

const DEFAULT_PLACE_LIMIT = 8;

@Injectable()
export class PlaceService {
  constructor(private readonly places: PlaceRepository) {}

  async search(
    query: string,
    limit: number = DEFAULT_PLACE_LIMIT,
  ): Promise<PlaceView[]> {
    const found = await this.places.findByName(query.trim(), limit);
    return found.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      lat: p.latitude,
      lng: p.longitude,
      imageUrl: p.mainImageUrl,
    }));
  }

  async findCandidates(query: CandidateQuery): Promise<PlaceCandidate[]> {
    const rows = await this.places.findInBoxWithTags(query);
    return rows.map((p: PlaceRow) => ({
      id: p.id,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      description: p.description,
      mainImageUrl: p.mainImageUrl,
      significance: p.significance,
      tags: p.tags,
    }));
  }
}
