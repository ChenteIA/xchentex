import "server-only";

import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { toCents } from "@/lib/money";

export const PRODUCT_IMAGES_BUCKET = "product-images";

export function productImageUrl(path: string | null): string | null {
  if (!path) return null;
  return `${publicEnv().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${encodeURI(path)}`;
}

// Lo único que recibe el navegador sobre cada producto (punto 17).
export type CatalogProduct = {
  id: string; // necesario para armar el pedido
  name: string;
  unitCents: number;
  packCents: number | null;
  packLabel: string | null;
  imageUrl: string | null;
};

export type CatalogCategory = {
  key: string; // clave corta para las pestañas; no es el id interno
  name: string;
  products: CatalogProduct[];
};

export type CatalogResult = { ok: true; categories: CatalogCategory[] } | { ok: false };

/**
 * Lee el catálogo público con la clave anon (sin sesión): RLS garantiza que
 * solo llegan categorías y productos activos. Columnas siempre explícitas.
 */
export async function getCatalog(): Promise<CatalogResult> {
  try {
    const env = publicEnv();
    const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const [cats, prods] = await Promise.all([
      db.from("categories").select("id, name").order("sort_order").order("name"),
      db
        .from("products")
        .select("id, category_id, name, unit_price, pack_price, pack_label, image_path")
        .order("sort_order")
        .order("name"),
    ]);

    if (cats.error || prods.error) {
      // El detalle solo va al log del servidor.
      console.error("[catalog] error al leer", cats.error ?? prods.error);
      return { ok: false };
    }

    const categories = cats.data
      .map((c, i) => ({
        key: `c${i + 1}`,
        name: c.name,
        products: prods.data
          .filter((p) => p.category_id === c.id)
          .map(
            (p): CatalogProduct => ({
              id: p.id,
              name: p.name,
              unitCents: toCents(p.unit_price),
              packCents: p.pack_price === null ? null : toCents(p.pack_price),
              packLabel: p.pack_label,
              imageUrl: productImageUrl(p.image_path),
            }),
          ),
      }))
      .filter((c) => c.products.length > 0);

    return { ok: true, categories };
  } catch (err) {
    console.error("[catalog] error inesperado", err);
    return { ok: false };
  }
}
