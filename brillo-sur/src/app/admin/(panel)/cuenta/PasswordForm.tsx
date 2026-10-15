"use client";

import { useActionState } from "react";
import { changePassword, type FormState } from "./actions";
import s from "../../admin.module.css";

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, { error: null });
  return (
    <form action={action} className={s.form}>
      <label className={s.field}>
        <span className={s.label}>Contraseña actual</span>
        <input className={s.input} type="password" name="current" required autoComplete="current-password" />
      </label>
      <label className={s.field}>
        <span className={s.label}>Nueva contraseña (mín. 10 caracteres)</span>
        <input
          className={s.input}
          type="password"
          name="next"
          required
          minLength={10}
          maxLength={72}
          autoComplete="new-password"
        />
      </label>
      <label className={s.field}>
        <span className={s.label}>Repite la nueva contraseña</span>
        <input className={s.input} type="password" name="confirm" required autoComplete="new-password" />
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
          {pending ? "Guardando…" : "Cambiar contraseña"}
        </button>
      </div>
    </form>
  );
}
