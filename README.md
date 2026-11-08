# Bolsa de Trabajo Departamental Digital: API

Backend del sistema de la Gobernación de Oruro. Conecta postulantes con empresas validadas por GADOR, con trazabilidad y reportes oficiales.

**Stack:** NestJS 11, TypeORM, PostgreSQL 16, JWT, Bcrypt, Cloudflare R2.
**Frontend:** repositorio aparte, una PWA con Vue 3.

## Requisitos

- Node.js 22.18 o superior
- PostgreSQL 16
- Un bucket privado de Cloudflare R2 (para CV, fotos, logos y documentos)
- Opcional: cuenta SMTP y claves VAPID, para correo y notificaciones push

## Instalación

```bash
npm install
cp .env.example .env     # completar con los valores propios
npm run migration:run    # crea las tablas
npm run seed             # roles, catálogos, configuración y SuperAdmin
npm run seed:demo        # opcional: empresas, postulantes y ofertas ficticias
npm run start:dev        # http://localhost:4000/api
```

Las credenciales viven solo en `.env`, que Git ignora. El SuperAdmin inicial se crea con `ADMIN_EMAIL` y `ADMIN_PASSWORD`; las cuentas de ejemplo usan `DEMO_PASSWORD`.

Para generar las claves push: `npx web-push generate-vapid-keys`.

## Comandos

| Comando | Uso |
|---|---|
| `npm run start:dev` | Desarrollo con recarga |
| `npm run build` | Compila en `dist/` |
| `npm test` | Pruebas de % perfil, % MATCH y transiciones de estado |
| `npm run migration:run` | Aplica migraciones |
| `npm run migration:generate` | Genera una migración desde las entidades |
| `npm run seed` / `npm run seed:demo` | Datos iniciales / datos de ejemplo |
| `npm run migration:run:prod`, `seed:prod`, `seed:demo:prod` | Equivalentes sobre `dist/`, para producción |

## Estructura

Cada módulo sigue MVC: `controller` (rutas), `service` (reglas de negocio), `dto/` (validación) y `entities/` (modelo).

```
src/
  auth/            registro, login, OTP, recuperación, roles
  postulantes/     hoja de vida y % de completitud
  empresas/        registro y validación por GADOR
  ofertas/         CRUD, estados, buscador y favoritos
  postulaciones/   postular, % MATCH y selección
  notificaciones/  avisos internos, correo, push y aviso de 24 h
  dashboard/       indicadores de GADOR
  reportes/        Excel y PDF con membrete
  catalogos/       catálogos y configuración
  auditoria/       registro y visor de auditoría
  storage/         archivos en Cloudflare R2
  database/        migraciones y seeders
```

## Documentación

| Documento | Contenido |
|---|---|
| [docs/database.sql](docs/database.sql) | Script completo de la estructura |
| [docs/diagrama-er.png](docs/diagrama-er.png) | Diagrama entidad-relación |
| [docs/diccionario-datos.md](docs/diccionario-datos.md) | Diccionario de datos |
| [docs/MANUAL_TECNICO.md](docs/MANUAL_TECNICO.md) | Instalación, configuración y despliegue |
| [docs/MANUAL_USUARIO.md](docs/MANUAL_USUARIO.md) | Guía para postulantes, empresas y administradores |
| [docs/PRUEBAS.md](docs/PRUEBAS.md) | Lista de pruebas por requisito |
| [docs/DEFENSA.md](docs/DEFENSA.md) | Dónde está cada requisito y preguntas frecuentes |
| [docs/GUION_VIDEO.md](docs/GUION_VIDEO.md) | Guion del video de 2 minutos |
