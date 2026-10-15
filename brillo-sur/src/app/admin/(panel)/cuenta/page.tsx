import { requireStaff } from "@/lib/auth";
import { PasswordForm } from "./PasswordForm";
import s from "../../admin.module.css";

export default async function CuentaPage() {
  const staff = await requireStaff();
  return (
    <>
      <h1 className={s.h1}>Mi cuenta</h1>
      <p className={s.muted}>
        {staff.email} · {staff.role === "owner" ? "Dueño" : "Personal"}
      </p>
      <section className={s.card} aria-labelledby="pwd-t">
        <h2 id="pwd-t" className={s.h2}>
          Cambiar contraseña
        </h2>
        <PasswordForm />
      </section>
    </>
  );
}
