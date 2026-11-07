import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { CandidateQuery, PlaceCandidate } from "../services/types";
import { Place } from "../entities/place.entity";

const SELECT_WITH_TAGS = `
  SELECT p.id, p.name, p.latitude, p.longitude, p.description, p.significance,
         COALESCE(jsonb_object_agg(t.tag, t.percent) FILTER (WHERE t.tag IS NOT NULL), '{}'::jsonb) AS tags
    FROM places p
    LEFT JOIN place_tags t ON t.place_id = p.id`;

@Injectable()
export class PlaceRepository {
  constructor(
    @InjectRepository(Place) private readonly places: Repository<Place>,
  ) {}

  findInBoxWithTags(q: CandidateQuery): Promise<PlaceCandidate[]> {
    return this.places.query(
      `${SELECT_WITH_TAGS}
        WHERE p.latitude BETWEEN $1 AND $2
          AND p.longitude BETWEEN $3 AND $4
          AND EXISTS (SELECT 1 FROM place_tags m
                       WHERE m.place_id = p.id AND m.tag = ANY($5::style_tag[]) AND m.percent >= $6)
        GROUP BY p.id
        ORDER BY p.significance DESC
        LIMIT $7`,
      [q.south, q.north, q.west, q.east, q.tags, q.minPercent, q.limit],
    );
  }

  findByName(text: string, limit: number): Promise<PlaceCandidate[]> {
    const escaped = text.replace(/[\\%_]/g, (c) => `\\${c}`);
    return this.places.query(
      `${SELECT_WITH_TAGS}
        WHERE p.name ILIKE $1
        GROUP BY p.id
        ORDER BY (p.name ILIKE $2) DESC, p.significance DESC, p.name
        LIMIT $3`,
      [`%${escaped}%`, `${escaped}%`, limit],
    );
  }
}
