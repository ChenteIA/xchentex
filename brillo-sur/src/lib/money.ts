// Todo el dinero se maneja en céntimos (enteros) para evitar errores de redondeo.
export function toCents(value: number | string): number {
  return Math.round(Number(value) * 100);
}

export function formatSoles(cents: number): string {
  return `S/ ${(cents / 100).toFixed(2)}`;
}
