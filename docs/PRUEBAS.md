# Lista de pruebas manuales

Marca cada caso en la versión desplegada. Sirve también de ensayo para el video.

## Flujo del video

| # | Paso | Resultado esperado | OK |
|---|---|---|---|
| 1 | Registrar una empresa con logo y documentos | Queda PENDIENTE_VALIDACION | ☐ |
| 2 | Como SuperAdmin, abrir documentos y aprobar | Empresa APROBADA y aviso recibido | ☐ |
| 3 | Como empresa, crear oferta y enviar a revisión | EN_REVISION_GADOR | ☐ |
| 4 | Como SuperAdmin, aprobar la oferta | PUBLICADA y visible en el buscador | ☐ |
| 5 | Registrar postulante, validar OTP y completar perfil con CV | Más de 80 % | ☐ |
| 6 | Postular a la oferta | Aparece en el historial con su % MATCH | ☐ |
| 7 | Como empresa, abrir Postulantes y Ver perfil | Ve la ficha, descarga el CV; estado VISTO | ☐ |

## Por requisito

| RF | Caso | Resultado esperado | OK |
|---|---|---|---|
| RF01 | Ingresar 5 veces con contraseña errónea | Bloqueo de 15 minutos | ☐ |
| RF01 | Recuperar contraseña por correo | Llega el enlace y permite cambiarla | ☐ |
| RF01 | Cambiar contraseña en Cuenta | Funciona con la nueva y no con la anterior | ☐ |
| RF02 | Subir un archivo que no sea PDF como CV | Rechazado | ☐ |
| RF02 | Subir un PDF de más de 5 MB | Rechazado | ☐ |
| RF02 | Completar secciones | El porcentaje sube | ☐ |
| RF03 | Filtrar por palabra, profesión, salario, ubicación y modalidad | Resultados correctos con paginación | ☐ |
| RF03 | Guardar y quitar un favorito | Aparece y desaparece en Favoritos | ☐ |
| RF04 | Retirar una postulación no vista | Se retira | ☐ |
| RF04 | Intentar retirar una ya vista | No se permite | ☐ |
| RF05 | Registrar un NIT repetido | Rechazado | ☐ |
| RF06 | Rechazar sin motivo | No se permite | ☐ |
| RF06 | Empresa no aprobada intenta crear oferta | No se permite | ☐ |
| RF07 | Fecha de cierre pasada o salario mínimo mayor al máximo | Rechazado | ☐ |
| RF08 | Editar oferta que no es borrador | No se ofrece ni se permite | ☐ |
| RF08 | GADOR rechaza con motivo | Vuelve a BORRADOR con el motivo visible | ☐ |
| RF08 | Duplicar oferta | Nuevo borrador | ☐ |
| RF09 | Superar el límite de ofertas activas | Rechazado con mensaje | ☐ |
| RF10 | Postular con 80 % o menos | No se permite | ☐ |
| RF10 | Postular dos veces | No se permite | ☐ |
| RF10 | Postular a oferta vencida | No se permite | ☐ |
| RF11 | Avanzar por todas las etapas hasta Contratado | Orden correcto | ☐ |
| RF11 | Empresa ajena intenta ver el perfil | Acceso denegado | ☐ |
| RF12 | Abrir perfil, cambiar estado, validar empresa, publicar oferta | Llega cada aviso | ☐ |
| RF12 | Activar notificaciones en el celular | Llega el push | ☐ |
| RF13 | Comparar indicadores con los datos | Coinciden; cambian en 30 segundos | ☐ |
| RF14 | Descargar los 4 reportes en Excel y PDF | Abren con membrete y datos correctos | ☐ |
| RF15 | Agregar, renombrar y desactivar un catálogo | Lo inactivo no aparece en formularios | ☐ |
| RF15 | Cambiar el límite de ofertas | Se aplica | ☐ |
| RF16 | Validar una empresa y buscar en Auditoría | Registro con usuario, datos, IP y fecha | ☐ |

## PWA y seguridad

| Caso | Resultado esperado | OK |
|---|---|---|
| Instalar en Chrome Android | Icono propio y pantalla completa | ☐ |
| Recorrer el flujo en el celular | Sin cortes de diseño | ☐ |
| Postulante abre `/admin/panel` | Redirige al inicio | ☐ |
| Llamar a una API de admin con token de empresa | Respuesta 403 | ☐ |
| Escribir `<script>` en un campo de texto | Se muestra como texto | ☐ |
| Ejecutar `gitleaks detect` en ambos repositorios | Sin hallazgos | ☐ |
