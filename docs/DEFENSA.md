# Guía de defensa

## Idea en una frase

Una PWA donde GADOR valida empresas y ofertas, los postulantes se postulan con un perfil completo, y cada decisión queda auditada y disponible en reportes oficiales.

## Dónde está cada requisito

Las rutas del backend parten de `backend/src/`; las de pantallas, de `frontend/src/views/`.

| RF | Backend | Pantalla |
|---|---|---|
| RF01 Registro y login | `auth/auth.service.ts` | `publico/Registro`, `Login`, `Verificar`, `Olvide`, `Restablecer`; `CuentaView` |
| RF02 Perfil | `postulantes/postulantes.service.ts`, `completitud.ts` | `postulante/PerfilView` |
| RF03 Buscador y favoritos | `ofertas/ofertas.service.ts`, `postulaciones/postulaciones.service.ts` | `publico/BuscadorView`, `postulante/FavoritosView` |
| RF04 Historial y retiro | `postulaciones/postulaciones.service.ts` | `postulante/PostulacionesView` |
| RF05 Registro empresa | `empresas/empresas.service.ts` | `publico/RegistroEmpresaView` |
| RF06 Validación | `empresas/empresas.service.ts` (`cambiarEstado`) | `admin/EmpresasView` |
| RF07 CRUD de ofertas | `ofertas/ofertas.service.ts` | `empresa/OfertaFormView` |
| RF08 Estados de oferta | `ofertas/oferta-estados.ts` | `empresa/MisOfertasView`, `admin/OfertasRevisionView` |
| RF09 Mis ofertas y límite | `ofertas/ofertas.service.ts` | `empresa/MisOfertasView` |
| RF10 Postular y MATCH | `postulaciones/postulaciones.service.ts`, `match.ts` | `publico/OfertaDetalleView` |
| RF11 Selección | `postulaciones/postulacion-estados.ts` | `empresa/PostulantesOfertaView` |
| RF12 Notificaciones | `notificaciones/notificaciones.service.ts` | `NotificacionesView`, `sw.js` |
| RF13 Dashboard | `dashboard/dashboard.service.ts` | `admin/DashboardView` |
| RF14 Reportes | `reportes/reportes.service.ts` | `admin/ReportesView` |
| RF15 Catálogos | `catalogos/catalogos-admin.service.ts` | `admin/CatalogosView` |
| RF16 Auditoría | `auditoria/audit.service.ts` | `admin/AuditoriaView` |

## Cómo viaja una solicitud

Ejemplo: una empresa aprueba el paso de un candidato.

1. La pantalla llama a `PATCH /api/postulaciones/:id/estado` con el JWT.
2. `@Auth(Roles.Empresa)` comprueba el token y el rol.
3. El DTO valida el cuerpo; rechaza cualquier campo no declarado.
4. El service comprueba que la oferta sea de esa empresa y que la tabla `TRANSICIONES` permita el cambio.
5. Una transacción guarda el estado y su auditoría.
6. Se notifica al postulante por aviso interno, correo y push.

## Reglas que debes saber explicar

- **% de perfil:** datos personales 15, foto 5, formación 20, experiencia 15, habilidades 20, idiomas 5, CV 20. Para postular se exige más de 80. Sin CV, formación o habilidades no se alcanza; sin experiencia sí, pensando en recién titulados.
- **% MATCH:** cada habilidad obligatoria pesa 2 y cada deseable 1. Da el peso completo si alcanza el nivel y la mitad si es menor. Se calcula una vez, al postular.
- **Estados:** cada flujo es un objeto `TRANSICIONES` que indica a qué estados se puede pasar. Agregar un paso es cambiar una línea.
- **Visto:** ocurre solo cuando la empresa abre el perfil. Desde ese momento ya no se puede retirar la postulación.
- **Límite de ofertas:** global y configurable; cuenta En revisión, Publicada y En proceso.
- **Publicadas y cerradas este mes:** se obtienen de la auditoría, porque cada cambio de estado queda con fecha.

## Decisiones y por qué

| Decisión | Razón |
|---|---|
| NestJS | Impone MVC, y los decoradores hacen visible qué protege cada ruta |
| Un solo JWT de 8 horas | Cumple el requisito sin tablas de sesiones ni refresh tokens |
| El service usa el Repository directo | Menos capas que explicar, sin perder orden |
| Estado de autenticación en `users` | Evita tablas adicionales |
| Bucket privado con URL firmada | Un CV es dato personal: el backend comprueba permisos antes de entregarlo |
| Desactivar catálogos, no borrarlos | Las ofertas antiguas conservan su información |
| SQL directo en dashboard y reportes | Es la forma más legible de contar y agrupar |

## Preguntas probables

**¿Dónde está la protección CSRF?**
CSRF aprovecha que el navegador adjunta las cookies por sí solo. Aquí no hay cookies de sesión: el token va en la cabecera `Authorization`, que un sitio ajeno no puede enviar.

**El token en `localStorage`, ¿no es riesgoso ante XSS?**
Es el costo de esta simplicidad, y por eso se reduce el riesgo de XSS: Vue escapa todo, no se usa `v-html` y Helmet agrega cabeceras. El token además vence en 8 horas.

**¿El OTP llega por SMS?**
En la demo, `OTP_MODE=demo` muestra el código en pantalla porque un SMS real requiere un proveedor de pago. El punto de integración está aislado y se activa por configuración.

**¿Y WhatsApp?**
Los lineamientos lo marcan como opcional. Se priorizaron correo y notificación PWA.

**¿Cómo evitan que una empresa vea CV ajenos?**
El service comprueba que la postulación pertenezca a una oferta de esa empresa. Recién entonces se genera una URL firmada temporal.

**¿Cómo evitan postulaciones duplicadas?**
Con una restricción única en base de datos sobre oferta y postulante, además de la validación previa.

**¿Qué ocurre si falla algo a mitad de un cambio de estado?**
El cambio y su auditoría van en la misma transacción: o se guardan ambos o ninguno.

**¿Hay credenciales en el repositorio?**
No. `.env` está excluido y el historial se revisa con gitleaks. Incluso las cuentas de ejemplo leen su contraseña del entorno.

**¿Tiene pruebas?**
Pruebas unitarias de las reglas críticas (% perfil, % MATCH y transiciones, `npm test`) y una lista manual por requisito en `PRUEBAS.md`.

**¿Por qué CONTRATADO sobre total de postulaciones?**
El requisito dice "% CONTRATADO / POSTULADO". Se interpretó como la proporción de postulaciones que terminan en contratación.

**¿Vulnerabilidades conocidas?**
`npm audit` indica dos de severidad moderada en `uuid`, dependencia de `exceljs`. Afectan a una función que recibe un búfer propio, y que esta aplicación no utiliza. La única corrección disponible retrocede `exceljs` a una versión mayor antigua.

**¿Cómo escala?**
La API no guarda sesiones, así que puede replicarse. La tarea de aviso de 24 horas tendría que ejecutarse en una sola instancia.

## Mejoras a futuro

SMS real, WhatsApp, pruebas de extremo a extremo y logo oficial en los reportes.
