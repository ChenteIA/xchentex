import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import s from "../legal.module.css";

export const metadata: Metadata = { title: "Privacidad · Brillo Sur" };

// Texto base según la Ley 29733. El dueño debe revisarlo y completar sus datos.
export default async function Privacidad() {
  await connection();
  return (
    <main className={s.wrap}>
      <Link href="/" className={s.back}>
        ‹ Volver a la tienda
      </Link>
      <h1>Política de privacidad</h1>
      <p className={s.notice}>
        Texto base pendiente de revisión por el titular del negocio (razón social, RUC y dirección).
      </p>
      <h2>Qué datos pedimos</h2>
      <p>Al enviar un pedido solo pedimos el nombre de tu negocio y un número de celular.</p>
      <h2>Para qué los usamos</h2>
      <p>
        Únicamente para coordinar, despachar y cobrar tu pedido. No los vendemos ni los compartimos con terceros con
        fines comerciales.
      </p>
      <h2>Cómo los protegemos</h2>
      <ul>
        <li>El sitio funciona solo con conexión cifrada (HTTPS).</li>
        <li>El número de celular se guarda cifrado y solo lo ve el personal autorizado.</li>
      </ul>
      <h2>Tus derechos</h2>
      <p>
        Conforme a la Ley N.º 29733, Ley de Protección de Datos Personales, puedes pedir acceso, rectificación,
        cancelación u oposición al uso de tus datos escribiéndonos por WhatsApp.
      </p>
    </main>
  );
}
