import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Áreas profesionales: nuevo tipo de catálogo AREA, profesiones que apuntan
 * a su área por parent_id y habilidades con area_id (null = general).
 *
 * TypeORM corre las migraciones dentro de una transacción. PostgreSQL acepta
 * ADD VALUE ahí, pero no permite USAR el valor nuevo en la misma
 * transacción: por eso las áreas las crea el seed, no esta migración.
 */
export class AreasProfesionales1794300000000 implements MigrationInterface {
  name = 'AreasProfesionales1794300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."catalogos_tipo_enum" ADD VALUE IF NOT EXISTS 'AREA'`,
    );
    await queryRunner.query(`ALTER TABLE "habilidades" ADD "area_id" integer`);
    await queryRunner.query(
      `CREATE INDEX "IDX_habilidades_area_id" ON "habilidades" ("area_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "habilidades" ADD CONSTRAINT "FK_habilidades_area_id" FOREIGN KEY ("area_id") REFERENCES "catalogos"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "habilidades" DROP CONSTRAINT "FK_habilidades_area_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_habilidades_area_id"`);
    await queryRunner.query(`ALTER TABLE "habilidades" DROP COLUMN "area_id"`);
    await queryRunner.query(
      `UPDATE "catalogos" SET "parent_id" = NULL WHERE "parent_id" IN (SELECT "id" FROM "catalogos" WHERE "tipo" = 'AREA')`,
    );
    await queryRunner.query(`DELETE FROM "catalogos" WHERE "tipo" = 'AREA'`);
    // PostgreSQL no puede quitar un valor de un enum: se recrea el tipo.
    await queryRunner.query(
      `ALTER TYPE "public"."catalogos_tipo_enum" RENAME TO "catalogos_tipo_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."catalogos_tipo_enum" AS ENUM('RUBRO', 'PROFESION', 'TIPO_CONTRATO', 'MODALIDAD', 'DEPARTAMENTO', 'MUNICIPIO')`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogos" ALTER COLUMN "tipo" TYPE "public"."catalogos_tipo_enum" USING "tipo"::text::"public"."catalogos_tipo_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."catalogos_tipo_enum_old"`);
  }
}
