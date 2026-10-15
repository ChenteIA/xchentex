"use client";

import { createContext, useContext, useMemo, useState } from "react";

// Estado compartido entre el hero, el carrito y los enlaces de WhatsApp.
type OrderContextValue = {
  businessName: string;
  setBusinessName: (v: string) => void;
  waNumber: string;
};

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ waNumber, children }: { waNumber: string; children: React.ReactNode }) {
  const [businessName, setBusinessName] = useState("");
  const value = useMemo(() => ({ businessName, setBusinessName, waNumber }), [businessName, waNumber]);
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder(): OrderContextValue {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder debe usarse dentro de <OrderProvider>");
  return ctx;
}
