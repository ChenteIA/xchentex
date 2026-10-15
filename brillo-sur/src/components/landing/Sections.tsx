import Link from "next/link";
import { ArrowCircleIcon, DropIcon } from "@/components/icons";
import { BUSINESS } from "@/lib/business";
import { formatSoles } from "@/lib/money";
import { BusinessNameInput } from "./BusinessNameInput";
import { WaPriceListLink } from "./WaPriceListLink";
import s from "./landing.module.css";

export function TopBar() {
  return (
    <div className={s.topbar}>
      Reparto gratis en Mala desde {formatSoles(BUSINESS.freeDeliveryMinCents).replace(".00", "")} ·{" "}
      <a href="#catalogo">Ver catálogo mayorista ›</a>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className={s.header}>
      <div className={s.headerInner}>
        <a href="#" className={s.brand} aria-label="Brillo Sur, inicio">
          <DropIcon />
          <span>Brillo Sur</span>
        </a>
        <nav aria-label="Secciones" className={s.nav}>
          <a className={s.navLink} href="#catalogo">
            Catálogo
          </a>
          <a className={s.navLink} href="#como">
            Cómo pedir
          </a>
          <a className={s.navLink} href="#contacto">
            Contacto
          </a>
          <a className={s.btnPrimary} href="#catalogo">
            Hacer pedido
          </a>
        </nav>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section>
      <div className={s.heroGrid}>
        <div className={s.heroText}>
          <span className={s.tag}>Distribuidora mayorista · Mala, Cañete</span>
          <h1 className={s.h1}>Limpieza al por mayor, con el precio a la vista.</h1>
          <p className={s.lead}>
            Lejía, detergentes y desinfectantes para bodegas, restaurantes y hospedajes. Armas tu pedido aquí y llega
            por WhatsApp, listo para despachar.
          </p>
          <div className={s.heroForm}>
            <label htmlFor="negocio-hero" className="visually-hidden">
              Nombre de tu negocio
            </label>
            <BusinessNameInput id="negocio-hero" className={s.heroInput} placeholder="Nombre de tu negocio" />
            <WaPriceListLink className={s.btnPrimaryLg}>Pedir lista de precios</WaPriceListLink>
          </div>
          <a href="#catalogo" className={s.linkIcon}>
            <ArrowCircleIcon />
            Ver el catálogo con precios
          </a>
        </div>

        <div className={s.heroPanel} aria-label="Ejemplo de pedido">
          <div className={s.exampleCard}>
            <div className={s.rowBetween}>
              <span className={s.exampleTitle}>Pedido · Bodega Rosita</span>
              <span className={s.tagSm}>Ejemplo</span>
            </div>
            <div className={s.exampleLines}>
              <div className={s.rowBetween}>
                <span>2 cajas x12 · Lejía 1 L</span>
                <span className={s.muted}>S/ 68.00</span>
              </div>
              <div className={s.rowBetween}>
                <span>1 caja x4 · Detergente 4.5 kg</span>
                <span className={s.muted}>S/ 122.00</span>
              </div>
              <div className={s.rowBetween}>
                <span>6 und. · Lavavajillas 900 g</span>
                <span className={s.muted}>S/ 36.00</span>
              </div>
            </div>
            <div className={s.exampleTotal}>
              <span className={s.mutedSm}>Total</span>
              <span className={s.exampleTotalValue}>S/ 226.00</span>
            </div>
          </div>
          <div className={s.statGrid}>
            <div className={s.stat}>
              <span className={s.statValue}>S/ 150</span>
              <span className={s.mutedSm}>Reparto gratis desde este monto</span>
            </div>
            <div className={s.stat}>
              <span className={s.statValue}>24 h</span>
              <span className={s.mutedSm}>Pides hoy, recibes mañana</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const CLIENTS = ["Bodegas", "Restaurantes", "Hospedajes", "Colegios", "Empresas", "Lavanderías"];

export function Clients() {
  return (
    <section aria-labelledby="cli-t" className={s.alt}>
      <div className={s.clientsInner}>
        <h2 id="cli-t" className={s.h2Sm}>
          Abastecemos a los negocios de Mala y alrededores
        </h2>
        <ul className={s.clientsGrid}>
          {CLIENTS.map((c) => (
            <li key={c} className={s.clientChip}>
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const STEPS = [
  { title: "Elige tus productos", text: "Por unidad o por caja, con el precio a la vista." },
  { title: "Envía el pedido", text: "Llega por WhatsApp ordenado, con cantidades y total." },
  { title: "Recíbelo mañana", text: "Paga con Yape, Plin, transferencia o efectivo." },
];

export function HowTo() {
  return (
    <section id="como" aria-labelledby="como-t" className={s.alt}>
      <div className={s.section}>
        <h2 id="como-t" className={s.h2}>
          Tu pedido en tres pasos
        </h2>
        <ol className={s.steps}>
          {STEPS.map((step, i) => (
            <li key={step.title} className={s.step}>
              <span className={s.stepNum}>Paso {i + 1}</span>
              <strong className={s.stepTitle}>{step.title}</strong>
              <span className={s.muted}>{step.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const BENEFITS = [
  { title: "Precio mayorista", text: "Mientras más compras por caja, menos pagas por unidad." },
  { title: "Reparto propio", text: "Gratis desde S/ 150 en Mala. Consulta otras zonas." },
  { title: "Crédito frecuente", text: "Paga a 7 o 15 días después de tus primeros pedidos." },
  { title: "Boleta o factura", text: "Comprobante electrónico en todos tus pedidos." },
];

export function Benefits() {
  return (
    <section aria-labelledby="ben-t">
      <div className={s.section}>
        <h2 id="ben-t" className={s.h2}>
          Por qué Brillo Sur
        </h2>
        <div className={s.benefits}>
          {BENEFITS.map((b) => (
            <div key={b.title} className={s.benefit}>
              <strong className={s.benefitTitle}>{b.title}</strong>
              <span className={s.muted}>{b.text}</span>
            </div>
          ))}
        </div>
        <div className={s.zones}>
          <span className={s.zonesLabel}>Repartimos en</span>
          <ul className={s.zoneList}>
            {BUSINESS.zones.map((z) => (
              <li key={z} className={s.zone}>
                {z}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// Reseñas de ejemplo: reemplazar por reseñas reales con permiso de los clientes.
const REVIEWS = [
  {
    quote:
      "Antes llamaba para preguntar cada precio. Ahora armo el pedido de la semana en cinco minutos y llega al día siguiente.",
    who: "Bodega",
  },
  {
    quote: "Para el hospedaje compramos lejía y detergente por caja. Buen precio y siempre puntuales.",
    who: "Hospedaje",
  },
];

export function Reviews() {
  return (
    <section aria-labelledby="rev-t" className={s.alt}>
      <div className={s.section}>
        <h2 id="rev-t" className={s.h2}>
          Lo que dicen los clientes
        </h2>
        <div className={s.reviews}>
          {REVIEWS.map((r) => (
            <figure key={r.who} className={s.review}>
              <blockquote className={s.quote}>“{r.quote}”</blockquote>
              <figcaption className={s.reviewWho}>
                <span className={s.strong}>{r.who}</span>
                <span className={s.muted}>Reseña de ejemplo</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contacto" aria-labelledby="con-t">
      <div className={s.contactGrid}>
        <div className={s.contactText}>
          <h2 id="con-t" className={s.h2}>
            Pide hoy, recibe mañana
          </h2>
          <p className={s.leadSm}>{BUSINESS.address} También puedes recoger tu pedido en el local.</p>
          <dl className={s.hours}>
            {BUSINESS.hours.map((h) => (
              <div key={h.days} className={s.hoursRow}>
                <dt className={s.strongish}>{h.days}</dt>
                <dd className={s.muted}>{h.time}</dd>
              </div>
            ))}
          </dl>
          <WaPriceListLink className={s.btnPrimaryMd}>Pedir lista de precios completa</WaPriceListLink>
        </div>
        <div className={s.map} role="img" aria-label="Espacio para el mapa">
          <span className={s.tagWhite}>Mapa de Google</span>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter({ waDisplay }: { waDisplay: string }) {
  return (
    <footer className={s.footer}>
      <div className={s.footerInner}>
        <div className={s.footerBrand}>
          <span className={s.footerName}>Brillo Sur</span>
          <span>{BUSINESS.tagline}</span>
          {waDisplay && <span>WhatsApp: {waDisplay}</span>}
        </div>
        <div className={s.footerCol}>
          <span className={s.footerHead}>Tienda</span>
          <a href="#catalogo">Catálogo</a>
          <a href="#como">Cómo pedir</a>
        </div>
        <div className={s.footerCol}>
          <span className={s.footerHead}>Legal</span>
          <Link href="/libro-de-reclamaciones">Libro de reclamaciones</Link>
          <Link href="/privacidad">Privacidad</Link>
        </div>
        <p className={s.footerLegal}>
          © {new Date().getFullYear()} Brillo Sur · Distribuidora de productos de limpieza
        </p>
      </div>
    </footer>
  );
}
