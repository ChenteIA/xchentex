import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getStaff } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import s from "../admin.module.css";

export const metadata: Metadata = { title: "Ingresar · Panel Brillo Sur", robots: { index: false, follow: false } };

export default async function LoginPage() {
  await connection();
  if (await getStaff()) redirect("/admin/pedidos");
  return (
    <main className={s.loginWrap}>
      <div className={s.loginCard}>
        <span className={s.brand}>Brillo Sur · Panel</span>
        <h1 className={s.h1}>Ingresar</h1>
        <LoginForm siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""} />
      </div>
    </main>
  );
}
