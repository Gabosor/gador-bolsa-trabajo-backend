/** Fecha actual en Bolivia con formato YYYY-MM-DD, igual que las columnas date. */
export function hoyBolivia(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
  }).format(new Date());
}
