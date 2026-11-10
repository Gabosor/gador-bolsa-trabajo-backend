# Bolsa de Trabajo Departamental Digital: API

Backend del sistema de la Gobernación de Oruro. Conecta postulantes con empresas validadas por GADOR, con trazabilidad y reportes oficiales.

**Stack:** NestJS 11, TypeORM, PostgreSQL 16, JWT, Bcrypt, Cloudflare R2, Evolution API v2 (WhatsApp).
**Frontend:** repositorio aparte, una PWA con Vue 3.

## Requisitos

- Node.js 22.18 o superior
- PostgreSQL 16
- Un bucket privado de Cloudflare R2 (para CV, fotos, logos y documentos)
- Opcional: cuenta SMTP y claves VAPID, para correo y notificaciones push
- Opcional: servidor de Evolution API v2, para el OTP y los avisos por WhatsApp. Con `OTP_MODE=demo` el código se muestra en pantalla; con `OTP_MODE=whatsapp` se envía al celular

## Instalación

```bash
npm install
cp .env.example .env     # completar con los valores propios
npm run migration:run    # crea las tablas
npm run seed             # roles, catálogos, configuración y SuperAdmin
npm run seed:demo        # opcional: empresas, postulantes y ofertas ficticias
                         # con -- --reset borra los datos demo y los vuelve a crear
npm run start:dev        # http://localhost:4000/api
```

Las credenciales viven solo en `.env`, que Git ignora. El SuperAdmin inicial se crea con `ADMIN_EMAIL` y `ADMIN_PASSWORD`; las cuentas de ejemplo usan `DEMO_PASSWORD`. Si R2 está configurado, `seed:demo` también sube logos y PDFs ficticios.

Para generar las claves push: `npx web-push generate-vapid-keys`.

## Comandos

| Comando | Uso |
|---|---|
| `npm run start:dev` | Desarrollo con recarga |
| `npm run build` | Compila en `dist/` |
| `npm test` | Pruebas de autenticación, % perfil, % MATCH, transiciones de estado, correo, WhatsApp, notificaciones, reportes, catálogos con áreas y archivos de ejemplo |
| `npm run migration:run` | Aplica migraciones |
| `npm run migration:generate` | Genera una migración desde las entidades |
| `npm run seed` / `npm run seed:demo` | Datos iniciales / datos de ejemplo (`-- --reset` los recrea) |
| `npm run migration:run:prod`, `seed:prod`, `seed:demo:prod` | Equivalentes sobre `dist/`, para producción |

La imagen de producción solo contiene `dist/`: dentro del contenedor se usan los comandos `:prod` (por ejemplo `npm run seed:demo:prod -- --reset`). Los demás necesitan `ts-node` y el código fuente, así que solo funcionan en local.

## Estructura

Cada módulo sigue MVC: `controller` (rutas), `service` (reglas de negocio), `dto/` (validación) y `entities/` (modelo).

```
src/
  auth/            registro, login, OTP, recuperación, roles
  postulantes/     hoja de vida y % de completitud
  empresas/        registro y validación por GADOR
  ofertas/         CRUD, estados, buscador y favoritos
  postulaciones/   postular, % MATCH y selección
  notificaciones/  avisos internos, correo, push, WhatsApp y aviso de 24 h
  dashboard/       indicadores de GADOR
  reportes/        Excel y PDF con membrete y escudo
  catalogos/       catálogos y configuración
  auditoria/       registro y visor de auditoría
  storage/         archivos en Cloudflare R2
  database/        migraciones, seeders y datos de ejemplo (demo/)
```

## Documentación

La documentación técnica no se versiona en este repositorio; se entrega por separado: script SQL, diagrama entidad-relación, diccionario de datos, manual técnico y manual de usuario.
