"use client";

import { startTransition, useActionState, useEffect, useRef, useState, useTransition } from "react";
import type { FormState } from "./actions";
import s from "../../admin.module.css";

export function CategoryForm({
  action,
  remove,
  initial,
  submitLabel,
  resetOnSuccess = false,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  remove?: () => Promise<FormState>;
  initial: { name: string; sortOrder: string; active: boolean };
  submitLabel: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [removing, startRemove] = useTransition();
  const [removeError, setRemoveError] = useState<string | null>(null);
  const error = state.error ?? removeError;
  const formRef = useRef<HTMLFormElement>(null);

  // Al crear con éxito, se limpia el formulario; si hubo error, se conservan los datos.
  useEffect(() => {
    if (resetOnSuccess && state.ok) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      className={s.form}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
    >
      <div className={s.formGrid}>
        <label className={s.field}>
          <span className={s.label}>Nombre</span>
          <input className={s.input} name="name" required maxLength={60} defaultValue={initial.name} />
        </label>
        <label className={s.field}>
          <span className={s.label}>Orden</span>
          <input
            className={s.input}
            name="sortOrder"
            inputMode="numeric"
            pattern="\d{0,4}"
            defaultValue={initial.sortOrder}
          />
        </label>
      </div>
      <label className={s.check}>
        <input type="checkbox" name="active" defaultChecked={initial.active} />
        Visible en el catálogo
      </label>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {state.ok && !error && (
        <p className={s.ok} role="status">
          {state.ok}
        </p>
      )}
      <div className={s.rowSide}>
        <button className={s.btnPrimary} type="submit" disabled={pending}>
          {pending ? "Guardando…" : submitLabel}
        </button>
        {remove && (
          <button
            type="button"
            className={s.btnDanger}
            disabled={removing}
            onClick={() => {
              if (!window.confirm("¿Eliminar esta categoría? Esta acción no se puede deshacer.")) return;
              startRemove(async () => setRemoveError((await remove()).error));
            }}
          >
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
}
