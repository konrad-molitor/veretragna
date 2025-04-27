import {
  IsString,
  IsOptional,
  IsNumber,
  IsUrl,
  Min,
  Max,
} from 'class-validator';

export class CreateLocationDto {
  @IsString()
    name: string;

  @IsString()
  @IsOptional()
    address?: string;

  @IsUrl()
  @IsOptional()
    imageUrl?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
    latitude?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
    longitude?: number;

  @IsString()
  @IsOptional()
    description?: string;
}
