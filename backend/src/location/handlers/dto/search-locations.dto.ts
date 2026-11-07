import { IsString, MaxLength, MinLength } from "class-validator";

export class SearchLocationsDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  query!: string;
}
