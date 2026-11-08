import { IsIn, IsISO8601, IsOptional, Matches } from 'class-validator';

export const FORMATOS = ['excel', 'pdf'] as const;
export type Formato = (typeof FORMATOS)[number];

const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export class ReporteDto {
  @IsIn(FORMATOS)
  formato: Formato;

  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(SOLO_FECHA)
  desde?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(SOLO_FECHA)
  hasta?: string;
}
