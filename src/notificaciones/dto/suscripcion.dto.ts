import { Type } from 'class-transformer';
import { IsString, IsUrl, ValidateNested } from 'class-validator';

class ClavesDto {
  @IsString()
  p256dh: string;

  @IsString()
  auth: string;
}

export class SuscripcionDto {
  @IsUrl()
  endpoint: string;

  @ValidateNested()
  @Type(() => ClavesDto)
  keys: ClavesDto;
}
