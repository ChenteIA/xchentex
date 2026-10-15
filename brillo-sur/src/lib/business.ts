// Datos del negocio que se muestran en la web. Edítalos aquí.
export const BUSINESS = {
  name: "Brillo Sur",
  tagline: "Productos de limpieza al por mayor · Mala, Cañete",
  freeDeliveryMinCents: 150_00,
  zones: ["Mala", "San Antonio", "Bujama", "Santa Cruz de Flores", "Calango", "Asia"],
  hours: [
    { days: "Lunes a sábado", time: "7:00 a. m. – 6:00 p. m." },
    { days: "Domingo", time: "7:00 a. m. – 1:00 p. m." },
  ],
  address: "Almacén en Mala (dirección por confirmar).",
} as const;

// Límites del pedido. Deben coincidir con la función create_order de la BD.
export const ORDER_LIMITS = {
  maxLines: 40,
  maxQuantity: 999,
  businessNameMin: 2,
  businessNameMax: 80,
} as const;
