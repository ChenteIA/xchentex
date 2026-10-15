"use client";

import { useActionState, useRef, useState } from "react";
import { Turnstile, type TurnstileHandle } from "@/components/Turnstile";
import { login, type LoginState } from "../actions";
import s from "../admin.module.css";

export function LoginForm({ siteKey }: { siteKey: string }) {
  const [token, setToken] = useState<string | null>(null);
  const turnstile = useRef<TurnstileHandle>(null);
  const [state, action, pending] = useActionState(async (prev: LoginState, fd: FormData) => {
    const result = await login(prev, fd);
    turnstile.current?.reset(); // cada token sirve una sola vez
    return result;
  }, { error: null });

  return (
    <form action={action} className={s.form}>
      <label className={s.field}>
        <span className={s.label}>Correo</span>
        <input className={s.input} type="email" name="email" autoComplete="username" required maxLength={254} />
      </label>
      <label className={s.field}>
        <span className={s.label}>Contraseña</span>
        <input
          className={s.input}
          type="password"
          name="password"
          autoComplete="current-password"
          required
          maxLength={72}
        />
      </label>
      <input type="hidden" name="turnstileToken" value={token ?? ""} />
      <Turnstile ref={turnstile} siteKey={siteKey} action="login" onToken={setToken} />
      {state.error && (
        <p className={s.error} role="alert">
          {state.error}
        </p>
      )}
      <button className={s.btnPrimary} type="submit" disabled={pending || !token}>
        {pending ? "Ingresando…" : token ? "Ingresar" : "Verificando…"}
      </button>
    </form>
  );
}
