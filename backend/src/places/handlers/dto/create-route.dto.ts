import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { PointDto } from "./point.dto";
import { STYLE_TAGS, type StyleTag } from "../../../common/types/style-tag";
import type { RouteQuery } from "../../services/types";

const MIN_DURATION = 15;
const MAX_DURATION = 720;
const MAX_TAGS = 20;

export class CreateRouteDto {
  @ValidateNested()
  @Type(() => PointDto)
  start!: PointDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PointDto)
  end?: PointDto;

  @IsInt()
  @Min(MIN_DURATION)
  @Max(MAX_DURATION)
  durationMinutes!: number;

  @IsArray()
  @ArrayMaxSize(MAX_TAGS)
  @IsIn(STYLE_TAGS, { each: true })
  tags!: StyleTag[];

  toQuery(): RouteQuery {
    return {
      start: this.start,
      end: this.end ?? this.start,
      durationMinutes: this.durationMinutes,
      tags: this.tags,
    };
  }
}
