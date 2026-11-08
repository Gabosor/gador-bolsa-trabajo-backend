export enum Roles {
  SuperAdmin = 'SUPERADMIN',
  Empresa = 'EMPRESA',
  Postulante = 'POSTULANTE',
}

export enum EstadoEmpresa {
  Pendiente = 'PENDIENTE_VALIDACION',
  Aprobada = 'APROBADA',
  Rechazada = 'RECHAZADA',
  Suspendida = 'SUSPENDIDA',
}

export enum EstadoOferta {
  Borrador = 'BORRADOR',
  EnRevision = 'EN_REVISION_GADOR',
  Publicada = 'PUBLICADA',
  EnProceso = 'EN_PROCESO_SELECCION',
  Cerrada = 'CERRADA',
  Anulada = 'ANULADA',
}

export enum EstadoPostulacion {
  Postulado = 'POSTULADO',
  Visto = 'VISTO',
  Preseleccionado = 'PRESELECCIONADO',
  Entrevista = 'ENTREVISTA',
  Finalista = 'FINALISTA',
  Contratado = 'CONTRATADO',
  Rechazado = 'RECHAZADO',
}

export enum TipoCatalogo {
  Rubro = 'RUBRO',
  Profesion = 'PROFESION',
  TipoContrato = 'TIPO_CONTRATO',
  Modalidad = 'MODALIDAD',
  Departamento = 'DEPARTAMENTO',
  Municipio = 'MUNICIPIO',
}

export enum AccionAudit {
  Create = 'CREATE',
  Update = 'UPDATE',
  Delete = 'DELETE',
  Login = 'LOGIN',
  ChangeStatus = 'CHANGE_STATUS',
}

/** 1 = básico, 2 = intermedio, 3 = avanzado. */
export enum NivelHabilidad {
  Basico = 1,
  Intermedio = 2,
  Avanzado = 3,
}
