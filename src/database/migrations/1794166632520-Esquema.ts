import { MigrationInterface, QueryRunner } from "typeorm";

export class Esquema1794166632520 implements MigrationInterface {
    name = 'Esquema1794166632520'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_accion_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'CHANGE_STATUS')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" SERIAL NOT NULL, "user_id" integer, "accion" "public"."audit_logs_accion_enum" NOT NULL, "tabla_afectada" character varying(60) NOT NULL, "registro_id" integer, "datos_anteriores" jsonb, "datos_nuevos" jsonb, "ip" character varying(64), "fecha" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."catalogos_tipo_enum" AS ENUM('RUBRO', 'PROFESION', 'TIPO_CONTRATO', 'MODALIDAD', 'DEPARTAMENTO', 'MUNICIPIO')`);
        await queryRunner.query(`CREATE TABLE "catalogos" ("id" SERIAL NOT NULL, "tipo" "public"."catalogos_tipo_enum" NOT NULL, "nombre" character varying(120) NOT NULL, "activo" boolean NOT NULL DEFAULT true, "parent_id" integer, CONSTRAINT "PK_1d78e1f35ded834637978e7cbf2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "configuraciones" ("clave" character varying(60) NOT NULL, "valor" character varying(255) NOT NULL, CONSTRAINT "PK_343e7df00b49bc3cc71d54c98d1" PRIMARY KEY ("clave"))`);
        await queryRunner.query(`CREATE TABLE "habilidades" ("id" SERIAL NOT NULL, "nombre" character varying(80) NOT NULL, "activo" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_89831c9fc1d969af53d4a831c98" UNIQUE ("nombre"), CONSTRAINT "PK_2f85f81d38ab1e59754157813d4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" SERIAL NOT NULL, "nombre" character varying(30) NOT NULL, CONSTRAINT "UQ_a5be7aa67e759e347b1c6464e10" UNIQUE ("nombre"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "nombre_completo" character varying(150) NOT NULL, "ci" character varying(20), "email" character varying(150) NOT NULL, "celular" character varying(20) NOT NULL, "password" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "failed_attempts" integer NOT NULL DEFAULT '0', "locked_until" TIMESTAMP WITH TIME ZONE, "phone_verified" boolean NOT NULL DEFAULT false, "otp_hash" character varying, "otp_expires_at" TIMESTAMP WITH TIME ZONE, "reset_token_hash" character varying, "reset_expires_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "role_id" integer NOT NULL, CONSTRAINT "UQ_eff3cf686729ac337fe991de64f" UNIQUE ("ci"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."empresas_estado_enum" AS ENUM('PENDIENTE_VALIDACION', 'APROBADA', 'RECHAZADA', 'SUSPENDIDA')`);
        await queryRunner.query(`CREATE TABLE "empresas" ("id" SERIAL NOT NULL, "nit" character varying(20) NOT NULL, "razon_social" character varying(200) NOT NULL, "representante_legal" character varying(150) NOT NULL, "ci_representante" character varying(20) NOT NULL, "celular" character varying(20) NOT NULL, "email_corporativo" character varying(150) NOT NULL, "direccion" character varying(255) NOT NULL, "logo_key" character varying, "descripcion" text NOT NULL, "documento_nit_key" character varying, "documento_legal_key" character varying, "estado" "public"."empresas_estado_enum" NOT NULL DEFAULT 'PENDIENTE_VALIDACION', "motivo_rechazo" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "rubro_id" integer NOT NULL, CONSTRAINT "UQ_3815a71fa4034941beaf0051189" UNIQUE ("nit"), CONSTRAINT "REL_7cbf50e3a99959587a52532a3c" UNIQUE ("user_id"), CONSTRAINT "PK_ce7b122b37c6499bfd6520873e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notificaciones" ("id" SERIAL NOT NULL, "titulo" character varying(150) NOT NULL, "mensaje" text NOT NULL, "leida" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "PK_a9d32a419ff58b53a38b5ef85d4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "push_subscriptions" ("id" SERIAL NOT NULL, "endpoint" text NOT NULL, "p256dh" character varying NOT NULL, "auth" character varying NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "UQ_0008bdfd174e533a3f98bf9af16" UNIQUE ("endpoint"), CONSTRAINT "PK_757fc8f00c34f66832668dc2e53" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "formaciones" ("id" SERIAL NOT NULL, "institucion" character varying(150) NOT NULL, "anio_titulacion" integer NOT NULL, "nro_titulo_nacional" character varying(50) NOT NULL, "profile_id" integer NOT NULL, "profesion_id" integer NOT NULL, CONSTRAINT "PK_1aa445b3581d5d21c51a42f91a7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "experiencias" ("id" SERIAL NOT NULL, "empresa" character varying(150) NOT NULL, "cargo" character varying(120) NOT NULL, "anios" integer NOT NULL, "descripcion" text NOT NULL, "profile_id" integer NOT NULL, CONSTRAINT "PK_8299f6bb73e2f3fe5590b134a7c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "postulante_habilidad" ("id" SERIAL NOT NULL, "nivel" integer NOT NULL, "profile_id" integer NOT NULL, "habilidad_id" integer NOT NULL, CONSTRAINT "UQ_aad9f3c458fcd6032d72dd8f757" UNIQUE ("profile_id", "habilidad_id"), CONSTRAINT "PK_c61646106bbb54c978467099ce0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "postulante_profiles" ("id" SERIAL NOT NULL, "foto_key" character varying, "direccion" character varying(255), "fecha_nacimiento" date, "cv_key" character varying, "idiomas" jsonb NOT NULL DEFAULT '[]', "porcentaje_completitud" integer NOT NULL DEFAULT '0', "user_id" integer NOT NULL, CONSTRAINT "REL_817aab4ef17274b30ee2221117" UNIQUE ("user_id"), CONSTRAINT "PK_5d096f32e4b3b4e8a3cc7abec21" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "oferta_habilidad" ("id" SERIAL NOT NULL, "obligatoria" boolean NOT NULL DEFAULT true, "nivel_minimo" integer NOT NULL DEFAULT '1', "oferta_id" integer NOT NULL, "habilidad_id" integer NOT NULL, CONSTRAINT "UQ_840081c7530740767089938e67d" UNIQUE ("oferta_id", "habilidad_id"), CONSTRAINT "PK_e8877701b031920db7cf8c0afe4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."ofertas_estado_enum" AS ENUM('BORRADOR', 'EN_REVISION_GADOR', 'PUBLICADA', 'EN_PROCESO_SELECCION', 'CERRADA', 'ANULADA')`);
        await queryRunner.query(`CREATE TABLE "ofertas" ("id" SERIAL NOT NULL, "titulo" character varying(150) NOT NULL, "descripcion" text NOT NULL, "requisitos_obligatorios" text NOT NULL, "requisitos_deseables" text, "anios_experiencia" integer NOT NULL DEFAULT '0', "salario_min" integer, "salario_max" integer, "salario_a_tratar" boolean NOT NULL DEFAULT false, "beneficios" text, "fecha_cierre" date NOT NULL, "numero_plazas" integer NOT NULL DEFAULT '1', "estado" "public"."ofertas_estado_enum" NOT NULL DEFAULT 'BORRADOR', "motivo_rechazo" text, "total_vistas" integer NOT NULL DEFAULT '0', "aviso_cierre_enviado" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "empresa_id" integer NOT NULL, "tipo_contrato_id" integer NOT NULL, "modalidad_id" integer NOT NULL, "municipio_id" integer NOT NULL, CONSTRAINT "PK_5ae09ce42a5883ce4500c7d05e3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "favoritos" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "profile_id" integer NOT NULL, "oferta_id" integer NOT NULL, CONSTRAINT "UQ_b886a4940f21d8e28cbacd0702f" UNIQUE ("profile_id", "oferta_id"), CONSTRAINT "PK_2a6a4d0119130451dc0b644590a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."postulaciones_estado_enum" AS ENUM('POSTULADO', 'VISTO', 'PRESELECCIONADO', 'ENTREVISTA', 'FINALISTA', 'CONTRATADO', 'RECHAZADO')`);
        await queryRunner.query(`CREATE TABLE "postulaciones" ("id" SERIAL NOT NULL, "estado" "public"."postulaciones_estado_enum" NOT NULL DEFAULT 'POSTULADO', "porcentaje_match" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "oferta_id" integer NOT NULL, "postulante_id" integer NOT NULL, CONSTRAINT "UQ_f6cbb8b639fe9fdeddefbd6e3be" UNIQUE ("oferta_id", "postulante_id"), CONSTRAINT "PK_9ba0a5bde35fc08e51d5a015a9a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "oferta_profesion" ("oferta_id" integer NOT NULL, "profesion_id" integer NOT NULL, CONSTRAINT "PK_0486edcb0ad7718596084ab0bdf" PRIMARY KEY ("oferta_id", "profesion_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_412f6159659f17371835afb55d" ON "oferta_profesion"  ("oferta_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a5d70837e2113b0a678d0f4d0f" ON "oferta_profesion"  ("profesion_id") `);
        await queryRunner.query(`ALTER TABLE "catalogos" ADD CONSTRAINT "FK_2a74ba1b1b38fc663d0ea3a9565" FOREIGN KEY ("parent_id") REFERENCES "catalogos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "empresas" ADD CONSTRAINT "FK_7cbf50e3a99959587a52532a3cf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "empresas" ADD CONSTRAINT "FK_6d70d2be95c2d23a1a69fe7b643" FOREIGN KEY ("rubro_id") REFERENCES "catalogos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notificaciones" ADD CONSTRAINT "FK_0a5f87551149ecc486ee8477c5f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "push_subscriptions" ADD CONSTRAINT "FK_6771f119f1c06d2ccf38f238664" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "formaciones" ADD CONSTRAINT "FK_a90e68ee678570d5259d068be9c" FOREIGN KEY ("profile_id") REFERENCES "postulante_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "formaciones" ADD CONSTRAINT "FK_cf00ef343cda8b9f646dbde3fae" FOREIGN KEY ("profesion_id") REFERENCES "catalogos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "experiencias" ADD CONSTRAINT "FK_761d8ce428d39b90851cbe32921" FOREIGN KEY ("profile_id") REFERENCES "postulante_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "postulante_habilidad" ADD CONSTRAINT "FK_1b1a35e10e3a796dfca394b0ff6" FOREIGN KEY ("profile_id") REFERENCES "postulante_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "postulante_habilidad" ADD CONSTRAINT "FK_7c960afc3dd3912dc62707e3b8c" FOREIGN KEY ("habilidad_id") REFERENCES "habilidades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "postulante_profiles" ADD CONSTRAINT "FK_817aab4ef17274b30ee2221117c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "oferta_habilidad" ADD CONSTRAINT "FK_42358f3a43181d7a2ecedbe2de3" FOREIGN KEY ("oferta_id") REFERENCES "ofertas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "oferta_habilidad" ADD CONSTRAINT "FK_f9848b38058a2bbb3fe4da34c22" FOREIGN KEY ("habilidad_id") REFERENCES "habilidades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ofertas" ADD CONSTRAINT "FK_3e3c112a192c6ed06efa32ba593" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ofertas" ADD CONSTRAINT "FK_6d78b5dcd5c1d019cc597f0342c" FOREIGN KEY ("tipo_contrato_id") REFERENCES "catalogos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ofertas" ADD CONSTRAINT "FK_02a9301f7709ab2a834d2ef2e50" FOREIGN KEY ("modalidad_id") REFERENCES "catalogos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ofertas" ADD CONSTRAINT "FK_723b166306d599a40c43c62c188" FOREIGN KEY ("municipio_id") REFERENCES "catalogos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "favoritos" ADD CONSTRAINT "FK_5695203b7ed302fd25f1f4753b6" FOREIGN KEY ("profile_id") REFERENCES "postulante_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "favoritos" ADD CONSTRAINT "FK_39a4487afb2613ac1ce84e385e1" FOREIGN KEY ("oferta_id") REFERENCES "ofertas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "postulaciones" ADD CONSTRAINT "FK_daa720af7330aa5803048361675" FOREIGN KEY ("oferta_id") REFERENCES "ofertas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "postulaciones" ADD CONSTRAINT "FK_ab6f470bc52a23cdd49e535eb9f" FOREIGN KEY ("postulante_id") REFERENCES "postulante_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "oferta_profesion" ADD CONSTRAINT "FK_412f6159659f17371835afb55d7" FOREIGN KEY ("oferta_id") REFERENCES "ofertas"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "oferta_profesion" ADD CONSTRAINT "FK_a5d70837e2113b0a678d0f4d0f6" FOREIGN KEY ("profesion_id") REFERENCES "catalogos"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "oferta_profesion" DROP CONSTRAINT "FK_a5d70837e2113b0a678d0f4d0f6"`);
        await queryRunner.query(`ALTER TABLE "oferta_profesion" DROP CONSTRAINT "FK_412f6159659f17371835afb55d7"`);
        await queryRunner.query(`ALTER TABLE "postulaciones" DROP CONSTRAINT "FK_ab6f470bc52a23cdd49e535eb9f"`);
        await queryRunner.query(`ALTER TABLE "postulaciones" DROP CONSTRAINT "FK_daa720af7330aa5803048361675"`);
        await queryRunner.query(`ALTER TABLE "favoritos" DROP CONSTRAINT "FK_39a4487afb2613ac1ce84e385e1"`);
        await queryRunner.query(`ALTER TABLE "favoritos" DROP CONSTRAINT "FK_5695203b7ed302fd25f1f4753b6"`);
        await queryRunner.query(`ALTER TABLE "ofertas" DROP CONSTRAINT "FK_723b166306d599a40c43c62c188"`);
        await queryRunner.query(`ALTER TABLE "ofertas" DROP CONSTRAINT "FK_02a9301f7709ab2a834d2ef2e50"`);
        await queryRunner.query(`ALTER TABLE "ofertas" DROP CONSTRAINT "FK_6d78b5dcd5c1d019cc597f0342c"`);
        await queryRunner.query(`ALTER TABLE "ofertas" DROP CONSTRAINT "FK_3e3c112a192c6ed06efa32ba593"`);
        await queryRunner.query(`ALTER TABLE "oferta_habilidad" DROP CONSTRAINT "FK_f9848b38058a2bbb3fe4da34c22"`);
        await queryRunner.query(`ALTER TABLE "oferta_habilidad" DROP CONSTRAINT "FK_42358f3a43181d7a2ecedbe2de3"`);
        await queryRunner.query(`ALTER TABLE "postulante_profiles" DROP CONSTRAINT "FK_817aab4ef17274b30ee2221117c"`);
        await queryRunner.query(`ALTER TABLE "postulante_habilidad" DROP CONSTRAINT "FK_7c960afc3dd3912dc62707e3b8c"`);
        await queryRunner.query(`ALTER TABLE "postulante_habilidad" DROP CONSTRAINT "FK_1b1a35e10e3a796dfca394b0ff6"`);
        await queryRunner.query(`ALTER TABLE "experiencias" DROP CONSTRAINT "FK_761d8ce428d39b90851cbe32921"`);
        await queryRunner.query(`ALTER TABLE "formaciones" DROP CONSTRAINT "FK_cf00ef343cda8b9f646dbde3fae"`);
        await queryRunner.query(`ALTER TABLE "formaciones" DROP CONSTRAINT "FK_a90e68ee678570d5259d068be9c"`);
        await queryRunner.query(`ALTER TABLE "push_subscriptions" DROP CONSTRAINT "FK_6771f119f1c06d2ccf38f238664"`);
        await queryRunner.query(`ALTER TABLE "notificaciones" DROP CONSTRAINT "FK_0a5f87551149ecc486ee8477c5f"`);
        await queryRunner.query(`ALTER TABLE "empresas" DROP CONSTRAINT "FK_6d70d2be95c2d23a1a69fe7b643"`);
        await queryRunner.query(`ALTER TABLE "empresas" DROP CONSTRAINT "FK_7cbf50e3a99959587a52532a3cf"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`);
        await queryRunner.query(`ALTER TABLE "catalogos" DROP CONSTRAINT "FK_2a74ba1b1b38fc663d0ea3a9565"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a5d70837e2113b0a678d0f4d0f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_412f6159659f17371835afb55d"`);
        await queryRunner.query(`DROP TABLE "oferta_profesion"`);
        await queryRunner.query(`DROP TABLE "postulaciones"`);
        await queryRunner.query(`DROP TYPE "public"."postulaciones_estado_enum"`);
        await queryRunner.query(`DROP TABLE "favoritos"`);
        await queryRunner.query(`DROP TABLE "ofertas"`);
        await queryRunner.query(`DROP TYPE "public"."ofertas_estado_enum"`);
        await queryRunner.query(`DROP TABLE "oferta_habilidad"`);
        await queryRunner.query(`DROP TABLE "postulante_profiles"`);
        await queryRunner.query(`DROP TABLE "postulante_habilidad"`);
        await queryRunner.query(`DROP TABLE "experiencias"`);
        await queryRunner.query(`DROP TABLE "formaciones"`);
        await queryRunner.query(`DROP TABLE "push_subscriptions"`);
        await queryRunner.query(`DROP TABLE "notificaciones"`);
        await queryRunner.query(`DROP TABLE "empresas"`);
        await queryRunner.query(`DROP TYPE "public"."empresas_estado_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "habilidades"`);
        await queryRunner.query(`DROP TABLE "configuraciones"`);
        await queryRunner.query(`DROP TABLE "catalogos"`);
        await queryRunner.query(`DROP TYPE "public"."catalogos_tipo_enum"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_accion_enum"`);
    }

}
