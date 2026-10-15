import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/lib/security/csp";
import { sessionCookieOptions } from "@/lib/supabase/cookies";

/**
 * Se ejecuta antes de cada página:
 * - Fuerza HTTPS en Vercel (punto 19).
 * - Genera un nonce y aplica la CSP (punto 18).
 * - En /admin/*: valida la sesión con Supabase Auth, refresca las cookies
 *   HttpOnly y manda al login si no hay sesión (puntos 6 y 9).
 *   Cada página y acción del panel vuelve a verificar sesión y rol en el servidor.
 */
export async function proxy(request: NextRequest) {
  // Vercel ya redirige HTTP→HTTPS en su borde; esta es una segunda barrera.
  // Solo en Vercel, porque `next start` local marca todo como http.
  if (process.env.VERCEL === "1" && request.headers.get("x-forwarded-proto") === "http") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce, process.env.NEXT_PUBLIC_SUPABASE_URL);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const finish = (res: NextResponse) => {
    res.headers.set("Content-Security-Policy", csp);
    return res;
  };

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) return finish(response);

  // ----- Panel de administración -----
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return finish(response);

  const supabase = createServerClient(url, anonKey, {
    cookieOptions: sessionCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        response.headers.set("Cache-Control", "private, no-store");
        response.headers.set("X-Robots-Tag", "noindex, nofollow");
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, { ...options, ...sessionCookieOptions }),
        );
      },
    },
  });

  // getUser() consulta a Supabase Auth: un token falsificado o revocado no pasa.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLogin = pathname === "/admin/login";
  if (!user && !isLogin) {
    const to = request.nextUrl.clone();
    to.pathname = "/admin/login";
    to.search = "";
    const redirect = NextResponse.redirect(to);
    // Conserva las cookies que Supabase haya limpiado (p. ej. sesión vencida).
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    redirect.headers.set("Cache-Control", "private, no-store");
    return finish(redirect);
  }

  return finish(response);
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|robots.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
