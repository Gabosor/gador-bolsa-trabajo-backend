# Diccionario de datos

Base de datos PostgreSQL 16. Generado a partir del esquema real. Son 18 tablas; incluye las 12 exigidas por los lineamientos.

**Convenciones:** PK clave primaria, FK clave foránea, UQ valor único.

## Valores de los campos enum

| Tipo | Valores |
|---|---|
| `audit_logs_accion_enum` | CREATE, UPDATE, DELETE, LOGIN, CHANGE_STATUS |
| `catalogos_tipo_enum` | RUBRO, PROFESION, TIPO_CONTRATO, MODALIDAD, DEPARTAMENTO, MUNICIPIO |
| `empresas_estado_enum` | PENDIENTE_VALIDACION, APROBADA, RECHAZADA, SUSPENDIDA |
| `ofertas_estado_enum` | BORRADOR, EN_REVISION_GADOR, PUBLICADA, EN_PROCESO_SELECCION, CERRADA, ANULADA |
| `postulaciones_estado_enum` | POSTULADO, VISTO, PRESELECCIONADO, ENTREVISTA, FINALISTA, CONTRATADO, RECHAZADO |

## audit_logs

Registro de auditoría de acciones y cambios de estado (RF16).

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| id | integer | No | PK |  | Identificador único |
| user_id | integer | Sí |  |  | Usuario que actuó; vacío si fue el sistema |
| accion | enum | No |  |  | CREATE, UPDATE, DELETE, LOGIN o CHANGE_STATUS |
| tabla_afectada | character varying(60) | No |  |  | Tabla afectada |
| registro_id | integer | Sí |  |  | Identificador del registro afectado |
| datos_anteriores | jsonb | Sí |  |  | Valores previos en JSON |
| datos_nuevos | jsonb | Sí |  |  | Valores nuevos en JSON |
| ip | character varying(64) | Sí |  |  | Dirección IP de origen |
| fecha | timestamp with time zone | No |  | `now()` | Fecha y hora del evento |

## catalogos

Rubros, profesiones, tipos de contrato, modalidades, departamentos y municipios (RF15).

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| id | integer | No | PK |  | Identificador único |
| tipo | enum | No |  |  | Tipo de catálogo |
| nombre | character varying(120) | No |  |  | Nombre visible |
| activo | boolean | No |  | `true` | Si está disponible para nuevos registros |
| parent_id | integer | Sí | FK → catalogos.id |  | Departamento al que pertenece un municipio |

## configuraciones

Parámetros del sistema en formato clave y valor (RF15).

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| clave | character varying(60) | No | PK |  | Nombre del parámetro |
| valor | character varying(255) | No |  |  | Valor del parámetro |

## empresas

Empresas registradas y su estado de validación por GADOR (RF05, RF06).

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| id | integer | No | PK |  | Identificador único |
| nit | character varying(20) | No | UQ |  | NIT, único |
| razon_social | character varying(200) | No |  |  | Razón social |
| representante_legal | character varying(150) | No |  |  | Nombre del representante legal |
| ci_representante | character varying(20) | No |  |  | CI del representante |
| celular | character varying(20) | No |  |  | Número de celular |
| email_corporativo | character varying(150) | No |  |  | Correo corporativo |
| direccion | character varying(255) | No |  |  | Dirección |
| logo_key | character varying | Sí |  |  | Clave del logo en R2 |
| descripcion | text | No |  |  | Descripción en texto libre |
| documento_nit_key | character varying | Sí |  |  | Clave del documento NIT en R2 |
| documento_legal_key | character varying | Sí |  |  | Clave del documento legal en R2 |
| estado | enum | No |  | `'PENDIENTE_VALIDACION'` | Estado actual dentro de su flujo |
| motivo_rechazo | text | Sí |  |  | Motivo indicado por GADOR al rechazar |
| created_at | timestamp with time zone | No |  | `now()` | Fecha y hora de creación |
| user_id | integer | No | FK → users.id, UQ |  | Usuario propietario |
| rubro_id | integer | No | FK → catalogos.id |  | Rubro del catálogo |

## experiencias

Experiencia laboral del postulante.

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| id | integer | No | PK |  | Identificador único |
| empresa | character varying(150) | No |  |  | Empresa donde trabajó |
| cargo | character varying(120) | No |  |  | Cargo desempeñado |
| anios | integer | No |  |  | Años en el cargo |
| descripcion | text | No |  |  | Descripción en texto libre |
| profile_id | integer | No | FK → postulante_profiles.id |  | Perfil del postulante |

## favoritos

Ofertas guardadas por el postulante (RF03).

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| id | integer | No | PK |  | Identificador único |
| created_at | timestamp with time zone | No |  | `now()` | Fecha y hora de creación |
| profile_id | integer | No | FK → postulante_profiles.id |  | Perfil del postulante |
| oferta_id | integer | No | FK → ofertas.id |  | Oferta relacionada |

## formaciones

Títulos académicos del postulante.

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| id | integer | No | PK |  | Identificador único |
| institucion | character varying(150) | No |  |  | Universidad o instituto |
| anio_titulacion | integer | No |  |  | Año de titulación |
| nro_titulo_nacional | character varying(50) | No |  |  | Número de título nacional |
| profile_id | integer | No | FK → postulante_profiles.id |  | Perfil del postulante |
| profesion_id | integer | No | FK → catalogos.id |  | Profesión del catálogo |

## habilidades

Catálogo de habilidades (RF15).

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| id | integer | No | PK |  | Identificador único |
| nombre | character varying(80) | No | UQ |  | Nombre visible |
| activo | boolean | No |  | `true` | Si está disponible para nuevos registros |

## notificaciones

Avisos internos de cada usuario (RF12).

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| id | integer | No | PK |  | Identificador único |
| titulo | character varying(150) | No |  |  | Título del aviso |
| mensaje | text | No |  |  | Texto del aviso |
| leida | boolean | No |  | `false` | Si el usuario ya la leyó |
| created_at | timestamp with time zone | No |  | `now()` | Fecha y hora de creación |
| user_id | integer | No | FK → users.id |  | Usuario propietario |

## oferta_habilidad

Habilidades que pide cada oferta; base del % MATCH (RF10).

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| id | integer | No | PK |  | Identificador único |
| obligatoria | boolean | No |  | `true` | Obligatoria (peso 2) o deseable (peso 1) |
| nivel_minimo | integer | No |  | `1` | Nivel mínimo pedido |
| oferta_id | integer | No | FK → ofertas.id |  | Oferta relacionada |
| habilidad_id | integer | No | FK → habilidades.id |  | Habilidad relacionada |

## oferta_profesion

Profesiones requeridas por cada oferta (relación N a N).

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| oferta_id | integer | No | PK, FK → ofertas.id |  | Oferta relacionada |
| profesion_id | integer | No | PK, FK → catalogos.id |  | Profesión del catálogo |

## ofertas

Ofertas laborales y su flujo de estados (RF07, RF08).

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| id | integer | No | PK |  | Identificador único |
| titulo | character varying(150) | No |  |  | Título de la oferta |
| descripcion | text | No |  |  | Descripción en texto libre |
| requisitos_obligatorios | text | No |  |  | Requisitos obligatorios |
| requisitos_deseables | text | Sí |  |  | Requisitos deseables |
| anios_experiencia | integer | No |  | `0` | Años de experiencia pedidos |
| salario_min | integer | Sí |  |  | Salario mínimo en bolivianos |
| salario_max | integer | Sí |  |  | Salario máximo en bolivianos |
| salario_a_tratar | boolean | No |  | `false` | Si el salario es a tratar |
| beneficios | text | Sí |  |  | Beneficios ofrecidos |
| fecha_cierre | date | No |  |  | Último día para postular |
| numero_plazas | integer | No |  | `1` | Número de plazas |
| estado | enum | No |  | `'BORRADOR'` | Estado actual dentro de su flujo |
| motivo_rechazo | text | Sí |  |  | Motivo indicado por GADOR al rechazar |
| total_vistas | integer | No |  | `0` | Veces que se abrió la oferta |
| aviso_cierre_enviado | boolean | No |  | `false` | Evita repetir el aviso de 24 horas |
| created_at | timestamp with time zone | No |  | `now()` | Fecha y hora de creación |
| updated_at | timestamp with time zone | No |  | `now()` | Fecha y hora de la última modificación |
| empresa_id | integer | No | FK → empresas.id |  | Empresa que publica |
| tipo_contrato_id | integer | No | FK → catalogos.id |  | Tipo de contrato |
| modalidad_id | integer | No | FK → catalogos.id |  | Modalidad de trabajo |
| municipio_id | integer | No | FK → catalogos.id |  | Municipio de la plaza |

## postulaciones

Postulación de un postulante a una oferta y su estado de selección (RF10, RF11).

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| id | integer | No | PK |  | Identificador único |
| estado | enum | No |  | `'POSTULADO'` | Estado actual dentro de su flujo |
| porcentaje_match | integer | No |  |  | % MATCH calculado al postular |
| created_at | timestamp with time zone | No |  | `now()` | Fecha y hora de creación |
| updated_at | timestamp with time zone | No |  | `now()` | Fecha y hora de la última modificación |
| oferta_id | integer | No | FK → ofertas.id |  | Oferta relacionada |
| postulante_id | integer | No | FK → postulante_profiles.id |  | Perfil del postulante |

## postulante_habilidad

Habilidades del postulante con su nivel.

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| id | integer | No | PK |  | Identificador único |
| nivel | integer | No |  |  | Nivel: 1 básico, 2 intermedio, 3 avanzado |
| profile_id | integer | No | FK → postulante_profiles.id |  | Perfil del postulante |
| habilidad_id | integer | No | FK → habilidades.id |  | Habilidad relacionada |

## postulante_profiles

Hoja de vida digital de cada postulante (RF02).

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| id | integer | No | PK |  | Identificador único |
| foto_key | character varying | Sí |  |  | Clave de la foto en Cloudflare R2 |
| direccion | character varying(255) | Sí |  |  | Dirección |
| fecha_nacimiento | date | Sí |  |  | Fecha de nacimiento |
| cv_key | character varying | Sí |  |  | Clave del CV en PDF en Cloudflare R2 |
| idiomas | jsonb | No |  | `'[]'` | Lista JSON de idiomas con su nivel |
| porcentaje_completitud | integer | No |  | `0` | Porcentaje de perfil completo (0 a 100) |
| user_id | integer | No | FK → users.id, UQ |  | Usuario propietario |

## push_subscriptions

Dispositivos suscritos a notificaciones push (RF12).

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| id | integer | No | PK |  | Identificador único |
| endpoint | text | No | UQ |  | URL del servicio push del navegador |
| p256dh | character varying | No |  |  | Clave pública del navegador |
| auth | character varying | No |  |  | Secreto de autenticación del navegador |
| user_id | integer | No | FK → users.id |  | Usuario propietario |

## roles

Roles del sistema: SUPERADMIN, EMPRESA y POSTULANTE.

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| id | integer | No | PK |  | Identificador único |
| nombre | character varying(30) | No | UQ |  | Nombre visible |

## users

Cuentas de acceso. Incluye el estado de autenticación: intentos, bloqueo, OTP y recuperación.

| Columna | Tipo | Nulo | Clave | Por defecto | Descripción |
|---|---|---|---|---|---|
| id | integer | No | PK |  | Identificador único |
| nombre_completo | character varying(150) | No |  |  | Nombre y apellidos |
| ci | character varying(20) | Sí | UQ |  | Cédula de identidad; vacía en empresas y administradores |
| email | character varying(150) | No | UQ |  | Correo de acceso, único |
| celular | character varying(20) | No |  |  | Número de celular |
| password | character varying | No |  |  | Contraseña cifrada con Bcrypt (costo 12) |
| is_active | boolean | No |  | `true` | Si la cuenta puede iniciar sesión |
| failed_attempts | integer | No |  | `0` | Intentos fallidos consecutivos |
| locked_until | timestamp with time zone | Sí |  |  | Fin del bloqueo tras 5 intentos fallidos |
| phone_verified | boolean | No |  | `false` | Si el celular fue validado por OTP |
| otp_hash | character varying | Sí |  |  | Código OTP cifrado |
| otp_expires_at | timestamp with time zone | Sí |  |  | Vencimiento del OTP |
| reset_token_hash | character varying | Sí |  |  | Token de recuperación cifrado |
| reset_expires_at | timestamp with time zone | Sí |  |  | Vencimiento del token de recuperación |
| created_at | timestamp with time zone | No |  | `now()` | Fecha y hora de creación |
| updated_at | timestamp with time zone | No |  | `now()` | Fecha y hora de la última modificación |
| role_id | integer | No | FK → roles.id |  | Rol de la cuenta |
