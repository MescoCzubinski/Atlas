import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Bbox } from "../services/geo";

@Entity("supported_cities")
export class City {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text", { unique: true })
  name: string;

  @Column("text")
  region: string;

  @Column("double precision")
  latitude: number;

  @Column("double precision")
  longitude: number;

  @Column("jsonb")
  bbox: Bbox;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;
}
