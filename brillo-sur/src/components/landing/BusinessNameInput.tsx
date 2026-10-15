"use client";

import { useOrder } from "@/components/OrderProvider";
import { ORDER_LIMITS } from "@/lib/business";

export function BusinessNameInput({ id, className, placeholder }: { id: string; className?: string; placeholder: string }) {
  const { businessName, setBusinessName } = useOrder();
  return (
    <input
      id={id}
      className={className}
      type="text"
      autoComplete="organization"
      maxLength={ORDER_LIMITS.businessNameMax}
      value={businessName}
      onChange={(e) => setBusinessName(e.target.value)}
      placeholder={placeholder}
    />
  );
}
