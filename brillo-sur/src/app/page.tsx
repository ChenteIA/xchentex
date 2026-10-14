import { connection } from "next/server";
import styles from "./page.module.css";

// Página provisional de la Fase 1. La landing completa llega en la Fase 3.
export default async function Home() {
  // Render dinámico: necesario para que cada respuesta lleve su nonce de CSP.
  await connection();

  return (
    <main className={styles.wrap}>
      <span className={styles.tag}>Distribuidora mayorista · Mala, Cañete</span>
      <h1 className={styles.title}>Brillo Sur</h1>
      <p className={styles.lead}>Sitio en construcción. Pronto: catálogo mayorista con pedidos por WhatsApp.</p>
    </main>
  );
}
