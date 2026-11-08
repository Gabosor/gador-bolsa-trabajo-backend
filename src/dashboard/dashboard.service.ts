import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

const ZONA = `'America/La_Paz'`;
const MES_ACTUAL = `date_trunc('month', now() AT TIME ZONE ${ZONA})`;

/** Indicadores de RF13. Cada uno es una consulta SQL directa y legible. */
@Injectable()
export class DashboardService {
  constructor(private readonly dataSource: DataSource) {}

  async resumen() {
    const [
      postulantes,
      empresas,
      ofertasActivas,
      publicadasMes,
      cerradasMes,
      postulacionesPorMes,
      postulantesPorProfesion,
      empresasPorRubro,
      postulaciones,
    ] = await Promise.all([
      this.uno(`SELECT count(*)::int AS total FROM users u
        JOIN roles r ON r.id = u.role_id WHERE r.nombre = 'POSTULANTE'`),
      this.dataSource.query<{ estado: string; total: number }[]>(
        `SELECT estado, count(*)::int AS total FROM empresas GROUP BY estado`,
      ),
      this.uno(`SELECT count(*)::int AS total FROM ofertas
        WHERE estado IN ('PUBLICADA', 'EN_PROCESO_SELECCION')`),
      this.ofertasDelMes('PUBLICADA'),
      this.ofertasDelMes('CERRADA'),
      this.dataSource.query<{ mes: string; total: number }[]>(
        `SELECT to_char(m, 'YYYY-MM') AS mes, count(p.id)::int AS total
         FROM generate_series(${MES_ACTUAL} - interval '11 months', ${MES_ACTUAL}, interval '1 month') m
         LEFT JOIN postulaciones p
           ON date_trunc('month', p.created_at AT TIME ZONE ${ZONA}) = m
         GROUP BY m ORDER BY m`,
      ),
      this.dataSource.query<{ nombre: string; total: number }[]>(
        `SELECT c.nombre, count(DISTINCT f.profile_id)::int AS total
         FROM formaciones f JOIN catalogos c ON c.id = f.profesion_id
         GROUP BY c.nombre ORDER BY total DESC, c.nombre`,
      ),
      this.dataSource.query<{ nombre: string; total: number }[]>(
        `SELECT c.nombre, count(*)::int AS total
         FROM empresas e JOIN catalogos c ON c.id = e.rubro_id
         GROUP BY c.nombre ORDER BY total DESC, c.nombre`,
      ),
      this.dataSource.query<{ total: number; contratados: number }[]>(
        `SELECT count(*)::int AS total,
           count(*) FILTER (WHERE estado = 'CONTRATADO')::int AS contratados
         FROM postulaciones`,
      ),
    ]);

    const porEstado = (estado: string) =>
      empresas.find((e) => e.estado === estado)?.total ?? 0;
    const { total, contratados } = postulaciones[0];

    return {
      totalPostulantes: postulantes,
      empresasValidadas: porEstado('APROBADA'),
      empresasPendientes: porEstado('PENDIENTE_VALIDACION'),
      ofertasActivas,
      ofertasPublicadasMes: publicadasMes,
      ofertasCerradasMes: cerradasMes,
      totalPostulaciones: total,
      totalContratados: contratados,
      tasaContratacion:
        total === 0 ? 0 : Math.round((contratados / total) * 1000) / 10,
      postulacionesPorMes,
      postulantesPorProfesion,
      empresasPorRubro,
    };
  }

  private async uno(sql: string, parametros: unknown[] = []): Promise<number> {
    const filas = await this.dataSource.query<{ total: number }[]>(
      sql,
      parametros,
    );
    return filas[0].total;
  }

  /** La fecha de cada cambio de estado se obtiene de la auditoría (RF16). */
  private ofertasDelMes(estado: string) {
    return this.uno(
      `SELECT count(DISTINCT registro_id)::int AS total FROM audit_logs
       WHERE tabla_afectada = 'ofertas' AND accion = 'CHANGE_STATUS'
         AND datos_nuevos->>'estado' = $1
         AND date_trunc('month', fecha AT TIME ZONE ${ZONA}) = ${MES_ACTUAL}`,
      [estado],
    );
  }
}
