import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Parámetros del sistema; por ejemplo, LIMITE_OFERTAS_ACTIVAS (RF15). */
@Entity('configuraciones')
export class Configuracion {
  @PrimaryColumn({ type: 'varchar', length: 60 })
  clave: string;

  @Column({ type: 'varchar', length: 255 })
  valor: string;
}
