/** Fecha actual en Bolivia con formato YYYY-MM-DD, igual que las columnas date. */
export function hoyBolivia(): string {
  return formatear(new Date());
}

export function mananaBolivia(): string {
  return formatear(new Date(Date.now() + 24 * 60 * 60 * 1000));
}

function formatear(fecha: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
  }).format(fecha);
}
