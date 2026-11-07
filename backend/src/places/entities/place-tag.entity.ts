import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { STYLE_TAGS, type StyleTag } from "../../common/types/style-tag";
import { Place } from "./place.entity";

@Entity("place_tags")
@Index("place_tags_tag_percent_idx", ["tag", "percent"])
@Check("place_tags_percent_check", "percent BETWEEN 0 AND 100")
export class PlaceTag {
  @PrimaryColumn("uuid", { name: "place_id" })
  placeId: string;

  @ManyToOne(() => Place, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "place_id",
    foreignKeyConstraintName: "place_tags_place_id_fkey",
  })
  place: Place;

  @PrimaryColumn({ type: "enum", enum: STYLE_TAGS, enumName: "style_tag" })
  tag: StyleTag;

  @Column("smallint")
  percent: number;
}
