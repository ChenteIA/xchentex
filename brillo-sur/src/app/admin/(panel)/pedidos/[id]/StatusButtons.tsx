"use client";

import { useState, useTransition } from "react";
import { setOrderStatus } from "../actions";
import { STATUS_LABEL, type OrderStatus } from "../format";
import s from "../../../admin.module.css";

export function StatusButtons({ orderId, current }: { orderId: string; current: OrderStatus }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <div className={s.statusButtons}>
        {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((k) => (
          <button
            key={k}
            type="button"
            className={k === current ? s.statusBtnActive : s.statusBtn}
            aria-pressed={k === current}
            disabled={pending || k === current}
            onClick={() =>
              start(async () => {
                const r = await setOrderStatus(orderId, k);
                setError(r.error);
              })
            }
          >
            {STATUS_LABEL[k]}
          </button>
        ))}
      </div>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
    </>
  );
}
