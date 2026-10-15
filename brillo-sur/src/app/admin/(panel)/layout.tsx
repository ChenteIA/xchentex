import type { Metadata } from "next";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth";
import { logout } from "../actions";
import { AdminNav } from "./AdminNav";
import s from "../admin.module.css";

export const metadata: Metadata = { title: "Panel · Brillo Sur", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await connection();
  // Verificación en el servidor (punto 6). Cada página y acción vuelve a verificar.
  const staff = await requireStaff();

  return (
    <div className={s.shell}>
      <div className={s.topbar}>
        <div className={s.topbarInner}>
          <span className={s.brand}>Brillo Sur · Panel</span>
          <div className={s.who}>
            <span>
              {staff.fullName || staff.email} · {staff.role === "owner" ? "Dueño" : "Personal"}
            </span>
            <form action={logout}>
              <button type="submit" className={s.logout}>
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </div>
      <AdminNav isOwner={staff.role === "owner"} />
      <main className={s.main}>{children}</main>
    </div>
  );
}
