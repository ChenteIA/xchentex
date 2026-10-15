export const STATUS_LABEL = { pendiente: "Pendiente", despachado: "Despachado", cobrado: "Cobrado" } as const;
export type OrderStatus = keyof typeof STATUS_LABEL;

const dateFmt = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}
