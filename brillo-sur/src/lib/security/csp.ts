/**
 * Content-Security-Policy (punto 18).
 * Solo se permite: el propio sitio, Supabase (API y fotos de Storage),
 * Cloudflare Turnstile y Google Fonts. Los scripts llevan un nonce por petición.
 */
export function buildCsp(nonce: string, supabaseUrl: string | undefined): string {
  const isDev = process.env.NODE_ENV === "development";
  const supabase = supabaseUrl ? new URL(supabaseUrl).origin : "";
  const supabaseWs = supabase ? supabase.replace(/^https:/, "wss:") : "";
  const turnstile = "https://challenges.cloudflare.com";

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", turnstile, ...(isDev ? ["'unsafe-eval'"] : [])],
    // Los atributos style de React y Turnstile requieren estilos en línea; no ejecutan código.
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": ["'self'", "data:", "blob:", supabase].filter(Boolean),
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "connect-src": ["'self'", supabase, supabaseWs, turnstile, ...(isDev ? ["ws:"] : [])].filter(Boolean),
    "frame-src": [turnstile],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "manifest-src": ["'self'"],
    "worker-src": ["'self'", "blob:"],
  };

  const parts = Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`);
  if (!isDev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}
