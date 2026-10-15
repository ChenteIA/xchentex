"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { useOrder } from "@/components/OrderProvider";
import { BUSINESS, ORDER_LIMITS } from "@/lib/business";
import type { CatalogCategory, CatalogProduct } from "@/lib/catalog";
import { formatSoles } from "@/lib/money";
import { orderMessage, priceListMessage, waLink } from "@/lib/whatsapp";
import s from "./catalog.module.css";

type Form = "unit" | "pack";
type CartKey = `${string}|${Form}`;
type Cart = Record<CartKey, number>;
type Delivery = "reparto" | "recojo";

const PHONE_RE = /^9\d{8}$/;

function packWord(label: string): string {
  return label.split(" ")[0] || "Caja";
}

export function Catalog({ categories }: { categories: CatalogCategory[] }) {
  const { businessName, setBusinessName, waNumber } = useOrder();
  const [activeKey, setActiveKey] = useState(categories[0]?.key ?? "");
  const [cart, setCart] = useState<Cart>({});
  const [phone, setPhone] = useState("");
  const [delivery, setDelivery] = useState<Delivery>("reparto");
  // El error se recalcula en cada render: desaparece apenas el cliente corrige el dato.
  const [triedSend, setTriedSend] = useState(false);
  const [cartInView, setCartInView] = useState(false);
  const cartRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const uid = useId();

  const byId = useMemo(() => {
    const m = new Map<string, CatalogProduct>();
    categories.forEach((c) => c.products.forEach((p) => m.set(p.id, p)));
    return m;
  }, [categories]);

  const active = categories.find((c) => c.key === activeKey) ?? categories[0];

  // ---- Carrito ----
  const lines = (Object.entries(cart) as [CartKey, number][])
    .map(([key, qty]) => {
      const [id, form] = key.split("|") as [string, Form];
      const p = byId.get(id);
      if (!p) return null;
      const price = form === "pack" ? p.packCents : p.unitCents;
      if (price === null) return null;
      return { key, product: p, form, qty, subtotal: price * qty };
    })
    .filter((l) => l !== null);

  const totalCents = lines.reduce((sum, l) => sum + l.subtotal, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);
  const missingCents = Math.max(0, BUSINESS.freeDeliveryMinCents - totalCents);
  const isEmpty = lines.length === 0;

  // Oculta la barra fija del celular cuando el carrito ya está a la vista.
  useEffect(() => {
    const el = cartRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setCartInView(entry.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function validationError(): string | null {
    if (isEmpty) return "Agrega al menos un producto.";
    if (businessName.trim().length < ORDER_LIMITS.businessNameMin) return "Escribe el nombre de tu negocio.";
    if (!PHONE_RE.test(phone)) return "Escribe un celular de 9 dígitos que empiece en 9.";
    return null;
  }
  const error = triedSend ? validationError() : null;

  function change(key: CartKey, delta: number) {
    setCart((prev) => {
      const next = { ...prev };
      const isNewLine = !(key in next);
      if (isNewLine && delta > 0 && Object.keys(next).length >= ORDER_LIMITS.maxLines) return prev;
      const q = Math.min(ORDER_LIMITS.maxQuantity, (next[key] ?? 0) + delta);
      if (q <= 0) delete next[key];
      else next[key] = q;
      return next;
    });
  }

  function qtyOf(id: string, form: Form) {
    return cart[`${id}|${form}`] ?? 0;
  }

  // ---- Pestañas accesibles (flechas izquierda/derecha) ----
  function onTabKey(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const n = categories.length;
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % n;
    if (e.key === "ArrowLeft") next = (index - 1 + n) % n;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = n - 1;
    setActiveKey(categories[next].key);
    tabRefs.current[next]?.focus();
  }

  // ---- Envío ----
  function send() {
    setTriedSend(true);
    if (validationError()) return;

    // Fase 3: el mensaje se arma en el navegador. En la Fase 4 el servidor
    // valida, recalcula con precios reales, guarda el pedido y devuelve el enlace.
    const text = orderMessage({
      businessName,
      delivery,
      totalCents,
      lines: lines.map((l) => ({
        quantity: l.qty,
        formLabel: l.form === "pack" ? (l.product.packLabel ?? "").toLowerCase() : "und.",
        name: l.product.name,
        subtotalCents: l.subtotal,
      })),
    });
    window.location.assign(waLink(waNumber, text));
  }

  const panelId = `${uid}-panel`;

  return (
    <>
      <div role="tablist" aria-label="Categorías" className={s.tabs}>
        {categories.map((c, i) => {
          const selected = c.key === active?.key;
          return (
            <button
              key={c.key}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${c.key}`}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              className={selected ? s.tabActive : s.tab}
              onClick={() => setActiveKey(c.key)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      <div className={s.layout}>
        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={active ? `${uid}-tab-${active.key}` : undefined}
          className={s.grid}
        >
          {active?.products.map((p) => {
            const qu = qtyOf(p.id, "unit");
            const qp = qtyOf(p.id, "pack");
            const parts: string[] = [];
            if (qp && p.packLabel) parts.push(`${qp} ${p.packLabel.toLowerCase()}`);
            if (qu) parts.push(`${qu} und.`);
            return (
              <article key={p.id} className={s.card}>
                <div className={s.photo}>
                  {p.imageUrl ? (
                    <Image src={p.imageUrl} alt={p.name} fill sizes="(max-width: 600px) 100vw, 300px" className={s.img} />
                  ) : (
                    <span className="visually-hidden">Producto sin foto</span>
                  )}
                  {parts.length > 0 && <span className={s.inCart}>En pedido: {parts.join(" + ")}</span>}
                </div>
                <div className={s.cardBody}>
                  <h3 className={s.cardTitle}>{p.name}</h3>
                  <div className={s.prices}>
                    <div className={s.priceCol}>
                      <span className={s.priceLabel}>Unidad</span>
                      <span className={s.unitPrice}>{formatSoles(p.unitCents)}</span>
                    </div>
                    {p.packCents !== null && p.packLabel && (
                      <div className={s.priceColEnd}>
                        <span className={s.priceLabel}>{p.packLabel}</span>
                        <span className={s.packPrice}>{formatSoles(p.packCents)}</span>
                      </div>
                    )}
                  </div>
                  <div className={s.addRow}>
                    <button
                      type="button"
                      className={s.btnOutline}
                      onClick={() => change(`${p.id}|unit`, 1)}
                      aria-label={`Agregar una unidad de ${p.name}`}
                    >
                      + Unidad
                    </button>
                    {p.packCents !== null && p.packLabel && (
                      <button
                        type="button"
                        className={s.btnDark}
                        onClick={() => change(`${p.id}|pack`, 1)}
                        aria-label={`Agregar ${p.packLabel} de ${p.name}`}
                      >
                        + {packWord(p.packLabel)}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside id="pedido" ref={cartRef} aria-labelledby="ped-t" className={s.cart}>
          <div className={s.rowBetween}>
            <h3 id="ped-t" className={s.cartTitle}>
              Tu pedido
            </h3>
            <span className={s.tag} aria-live="polite">
              {itemCount} {itemCount === 1 ? "ítem" : "ítems"}
            </span>
          </div>

          {isEmpty ? (
            <p className={s.emptyText}>Agrega productos del catálogo. Aquí verás cantidades y total.</p>
          ) : (
            <ul className={s.lines}>
              {lines.map((l) => (
                <li key={l.key} className={s.line}>
                  <div className={s.lineText}>
                    <span className={s.lineName}>{l.product.name}</span>
                    <span className={s.lineDetail}>
                      {l.form === "pack" ? l.product.packLabel : "Unidad"} · {formatSoles(l.subtotal)}
                    </span>
                  </div>
                  <div className={s.stepper}>
                    <button
                      type="button"
                      className={s.stepBtn}
                      onClick={() => change(l.key, -1)}
                      aria-label={`Quitar uno de ${l.product.name}`}
                    >
                      −
                    </button>
                    <span className={s.qty}>{l.qty}</span>
                    <button
                      type="button"
                      className={s.stepBtn}
                      onClick={() => change(l.key, 1)}
                      disabled={l.qty >= ORDER_LIMITS.maxQuantity}
                      aria-label={`Agregar uno más de ${l.product.name}`}
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className={s.field}>
            <label htmlFor="negocio" className={s.label}>
              Nombre de tu negocio
            </label>
            <input
              id="negocio"
              type="text"
              autoComplete="organization"
              maxLength={ORDER_LIMITS.businessNameMax}
              className={s.input}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ej.: Bodega Rosita"
            />
          </div>

          <div className={s.field}>
            <label htmlFor="celular" className={s.label}>
              Celular
            </label>
            <input
              id="celular"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={11}
              className={s.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
              placeholder="9XX XXX XXX"
              aria-describedby="celular-ayuda"
            />
            <span id="celular-ayuda" className={s.help}>
              Solo para coordinar este pedido. <Link href="/privacidad">Privacidad</Link>
            </span>
          </div>

          <fieldset className={s.delivery}>
            <legend className={s.label}>Entrega</legend>
            <div className={s.segmented}>
              {(["reparto", "recojo"] as const).map((d) => (
                <label key={d} className={delivery === d ? s.segActive : s.seg}>
                  <input
                    type="radio"
                    name="entrega"
                    value={d}
                    checked={delivery === d}
                    onChange={() => setDelivery(d)}
                    className="visually-hidden"
                  />
                  {d === "reparto" ? "Reparto" : "Recojo en local"}
                </label>
              ))}
            </div>
          </fieldset>

          <div className={s.totalRow}>
            <span className={s.muted}>Total</span>
            <span className={s.total}>{formatSoles(totalCents)}</span>
          </div>

          {!isEmpty && delivery === "reparto" && missingCents > 0 && (
            <p className={s.note}>Te faltan {formatSoles(missingCents)} para el reparto gratis en Mala.</p>
          )}
          {delivery === "reparto" && missingCents === 0 && (
            <p className={s.noteStrong}>Tu pedido tiene reparto gratis en Mala.</p>
          )}

          {error && (
            <p className={s.error} role="alert">
              {error}
            </p>
          )}

          <button type="button" className={s.send} onClick={send}>
            <WhatsAppIcon />
            Enviar pedido por WhatsApp
          </button>

          {!isEmpty && (
            <button type="button" className={s.clear} onClick={() => setCart({})}>
              Vaciar pedido
            </button>
          )}
        </aside>
      </div>

      {/* Celular: barra fija con el total cuando hay productos; si no, botón flotante de WhatsApp. */}
      {!isEmpty && !cartInView ? (
        <a href="#pedido" className={s.mobileBar}>
          <span>
            Ver pedido · {itemCount} {itemCount === 1 ? "ítem" : "ítems"}
          </span>
          <strong>{formatSoles(totalCents)}</strong>
        </a>
      ) : null}
      <a
        href={waLink(waNumber, priceListMessage(businessName))}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribir por WhatsApp"
        className={isEmpty ? s.fab : `${s.fab} ${s.fabHideMobile}`}
      >
        <WhatsAppIcon size={24} />
      </a>
    </>
  );
}
