"use client";

import { startTransition, useActionState, useEffect, useRef, useState, useTransition } from "react";
import { createUser, updateUser, type FormState } from "./actions";
import s from "../../admin.module.css";

export function NewUserForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createUser, { error: null });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form
      ref={ref}
      className={s.form}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className={s.formGrid}>
        <label className={s.field}>
          <span className={s.label}>Correo</span>
          <input className={s.input} type="email" name="email" required maxLength={254} autoComplete="off" />
        </label>
        <label className={s.field}>
          <span className={s.label}>Nombre (opcional)</span>
          <input className={s.input} name="fullName" maxLength={80} autoComplete="off" />
        </label>
        <label className={s.field}>
          <span className={s.label}>Rol</span>
          <select className={s.select} name="role" defaultValue="staff">
            <option value="staff">Personal</option>
            <option value="owner">Dueño</option>
          </select>
        </label>
        <label className={s.field}>
          <span className={s.label}>Contraseña inicial (mín. 10)</span>
          <input
            className={s.input}
            type="password"
            name="password"
            required
            minLength={10}
            maxLength={72}
            autoComplete="new-password"
          />
        </label>
      </div>
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
          {pending ? "Creando…" : "Crear usuario"}
        </button>
      </div>
    </form>
  );
}

export function UserRow(props: {
  id: string;
  email: string;
  fullName: string | null;
  role: "owner" | "staff";
  active: boolean;
  isSelf: boolean;
}) {
  const [role, setRole] = useState(props.role);
  const [active, setActive] = useState(props.active);
  const [msg, setMsg] = useState<FormState>({ error: null });
  const [pending, start] = useTransition();
  const dirty = role !== props.role || active !== props.active;

  return (
    <div className={s.row}>
      <div className={s.rowMain}>
        <span className={s.rowTitle}>{props.fullName || props.email}</span>
        <span className={s.small}>
          {props.email} {props.isSelf && "· tú"}
        </span>
        {msg.error && (
          <span className={s.error} role="alert">
            {msg.error}
          </span>
        )}
      </div>
      {props.isSelf ? (
        <span className={s.tag}>Dueño</span>
      ) : (
        <div className={s.rowSide}>
          <select
            className={s.select}
            aria-label={`Rol de ${props.email}`}
            value={role}
            onChange={(e) => setRole(e.target.value as "owner" | "staff")}
          >
            <option value="staff">Personal</option>
            <option value="owner">Dueño</option>
          </select>
          <label className={s.check}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Activo
          </label>
          <button
            type="button"
            className={s.btnSecondary}
            disabled={!dirty || pending}
            onClick={() => start(async () => setMsg(await updateUser(props.id, role, active)))}
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      )}
    </div>
  );
}
