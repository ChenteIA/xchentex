import type { NextConfig } from "next";

/**
 * Headers de seguridad para todas las rutas (puntos 18 y 19).
 * La Content-Security-Policy se arma en src/proxy.ts porque lleva un nonce por petición.
 */
const securityHeaders = [
  // HSTS: el navegador solo usará HTTPS durante 2 años, incluidos subdominios.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : undefined;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // Fotos de hasta 2 MB + datos del formulario (punto 16). El límite real se valida en la acción.
    serverActions: { bodySizeLimit: "3mb" },
  },
  images: {
    // Solo se optimizan fotos del bucket público de Supabase.
    // En producción Supabase siempre es https; http solo aparece con Supabase local.
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: supabaseUrl.protocol === "http:" ? "http" : "https",
            hostname: supabaseUrl.hostname,
            port: supabaseUrl.port,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    // Supabase local corre en 127.0.0.1; Next bloquea IPs privadas salvo que se permita.
    dangerouslyAllowLocalIP: supabaseUrl?.hostname === "127.0.0.1",
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
