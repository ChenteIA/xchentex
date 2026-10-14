import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/lib/security/csp";

/**
 * Se ejecuta antes de cada página:
 * - Fuerza HTTPS en producción (punto 19).
 * - Genera un nonce y aplica la CSP (punto 18).
 * La verificación de sesión para /admin se añade en la Fase 5.
 */
export function proxy(request: NextRequest) {
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

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
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
