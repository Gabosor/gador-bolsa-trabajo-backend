import { MigrationInterface, QueryRunner } from 'typeorm';

export class OtpIntentos1794200000000 implements MigrationInterface {
  name = 'OtpIntentos1794200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "otp_intentos" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "otp_intentos"`);
  }
}
