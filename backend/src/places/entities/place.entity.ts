import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Address } from "./address";
import type { PlaceFacts, PlaceLinks, PositionQuality } from "./place-facts";

@Entity("places")
@Index("places_position_idx", ["latitude", "longitude"])
export class Place {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text", { name: "external_id", nullable: true, unique: true })
  externalId: string | null;

  @Column("text")
  name: string;

  @Column("double precision")
  latitude: number;

  @Column("double precision")
  longitude: number;

  @Column("text", { nullable: true })
  description: string | null;

  @Column("jsonb")
  address: Address;

  @Column("text", { name: "position_quality", default: "point" })
  positionQuality: PositionQuality;

  @Column("smallint", { nullable: true })
  year: number | null;

  @Column("text", { name: "date_text", nullable: true })
  dateText: string | null;

  @Index("places_significance_idx")
  @Column("smallint", { default: 0 })
  significance: number;

  @Column("jsonb", { default: {} })
  facts: PlaceFacts;

  @Column("jsonb", { default: {} })
  links: PlaceLinks;

  @Column("text", { array: true, default: [] })
  sources: string[];

  @Column("text", { name: "main_image_url", nullable: true })
  mainImageUrl: string | null;

  @Column("text", { array: true, default: [] })
  images: string[];

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;
}
