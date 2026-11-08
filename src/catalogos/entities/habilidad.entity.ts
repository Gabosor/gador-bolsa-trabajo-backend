import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('habilidades')
export class Habilidad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 80, unique: true })
  nombre: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}
