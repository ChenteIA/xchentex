"use client";

import { useOrder } from "@/components/OrderProvider";
import { priceListMessage, waLink } from "@/lib/whatsapp";

// Enlace "Pedir lista de precios" que incluye el nombre del negocio si ya se escribió.
export function WaPriceListLink({
  className,
  children,
  ariaLabel,
}: {
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  const { businessName, waNumber } = useOrder();
  return (
    <a
      className={className}
      href={waLink(waNumber, priceListMessage(businessName))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
