import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import s from "../legal.module.css";

export const metadata: Metadata = { title: "Libro de reclamaciones · Brillo Sur" };

export default async function LibroDeReclamaciones() {
  await connection();
  return (
    <main className={s.wrap}>
      <Link href="/" className={s.back}>
        ‹ Volver a la tienda
      </Link>
      <h1>Libro de reclamaciones</h1>
      <p className={s.notice}>
        Pendiente: el titular del negocio debe habilitar su Libro de Reclamaciones virtual (Indecopi) y enlazarlo aquí.
      </p>
      <p>Mientras tanto, puedes registrar tu reclamo en el libro físico de nuestro local en Mala.</p>
    </main>
  );
}
