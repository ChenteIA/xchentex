"use client";

import { startTransition, useActionState } from "react";
import type { FormState } from "./actions";
import s from "../../admin.module.css";

export type ProductValues = {
  name: string;
  categoryId: string;
  unitPrice: string;
  packPrice: string;
  packLabel: string;
  sortOrder: string;
  active: boolean;
};

export function ProductForm({
  action,
  categories,
  initial,
  submitLabel,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  categories: { id: string; name: string; active: boolean }[];
  initial: ProductValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  return (
    <form
      className={s.form}
      onSubmit={(e) => {
        // Envío manual: así React no vacía el formulario si hay un error.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
    >
      <label className={s.field}>
        <span className={s.label}>Nombre</span>
        <input className={s.input} name="name" required maxLength={120} defaultValue={initial.name} />
      </label>
      <label className={s.field}>
        <span className={s.label}>Categoría</span>
        <select className={s.select} name="categoryId" required defaultValue={initial.categoryId}>
          <option value="" disabled>
            Elige una categoría
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.active ? "" : " (inactiva)"}
            </option>
          ))}
        </select>
      </label>
      <div className={s.formGrid}>
        <label className={s.field}>
          <span className={s.label}>Precio por unidad (S/)</span>
          <input
            className={s.input}
            name="unitPrice"
            inputMode="decimal"
            required
            placeholder="3.20"
            pattern="\d{1,5}([.,]\d{1,2})?"
            defaultValue={initial.unitPrice}
          />
        </label>
        <label className={s.field}>
          <span className={s.label}>Precio por empaque (S/, opcional)</span>
          <input
            className={s.input}
            name="packPrice"
            inputMode="decimal"
            placeholder="34.00"
            pattern="\d{1,5}([.,]\d{1,2})?"
            defaultValue={initial.packPrice}
          />
        </label>
        <label className={s.field}>
          <span className={s.label}>Empaque (ej. Caja x12, Fardo x12, Docena)</span>
          <input className={s.input} name="packLabel" maxLength={30} defaultValue={initial.packLabel} />
        </label>
        <label className={s.field}>
          <span className={s.label}>Orden en el catálogo</span>
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
      {state.error && (
        <p className={s.error} role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className={s.ok} role="status">
          {state.ok}
        </p>
      )}
      <div>
        <button className={s.btnPrimary} type="submit" disabled={pending}>
          {pending ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
