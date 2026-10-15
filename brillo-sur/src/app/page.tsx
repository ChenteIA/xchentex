import { connection } from "next/server";
import { Catalog } from "@/components/catalog/Catalog";
import { OrderProvider } from "@/components/OrderProvider";
import {
  Benefits,
  Clients,
  Contact,
  Hero,
  HowTo,
  Reviews,
  SiteFooter,
  SiteHeader,
  TopBar,
} from "@/components/landing/Sections";
import { getCatalog } from "@/lib/catalog";
import s from "./home.module.css";

function formatWa(digits: string): string {
  // 51900000000 → 900 000 000
  const local = digits.startsWith("51") ? digits.slice(2) : digits;
  return local.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
}

export default async function Home() {
  // Render dinámico: cada respuesta lleva su nonce de CSP y precios al día.
  await connection();
  const catalog = await getCatalog();
  const waNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

  return (
    <OrderProvider waNumber={waNumber}>
      <TopBar />
      <SiteHeader />
      <main>
        <Hero />
        <Clients />
        <section id="catalogo" aria-labelledby="cat-t" className={s.catalogSection}>
          <div className={s.catalogInner}>
            <div className={s.catalogIntro}>
              <h2 id="cat-t" className={s.h2}>
                Catálogo mayorista
              </h2>
              <p className={s.lead}>
                Compra por unidad o por caja. Al final envías el pedido completo por WhatsApp y confirmamos el reparto.
              </p>
            </div>
            {catalog.ok && catalog.categories.length > 0 ? (
              <Catalog categories={catalog.categories} />
            ) : (
              <p className={s.unavailable} role="status">
                No pudimos cargar el catálogo en este momento. Escríbenos por WhatsApp y te enviamos la lista de
                precios.
              </p>
            )}
          </div>
        </section>
        <HowTo />
        <Benefits />
        <Reviews />
        <Contact />
      </main>
      <SiteFooter waDisplay={waNumber ? formatWa(waNumber) : ""} />
    </OrderProvider>
  );
}
