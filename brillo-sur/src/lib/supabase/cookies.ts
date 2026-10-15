/**
 * Opciones de las cookies de sesión (punto 9).
 * HttpOnly: el JavaScript del navegador no puede leer el token.
 * Secure: solo viajan por HTTPS (en desarrollo local se permite http).
 * SameSite=Lax: no se envían en peticiones cross-site que modifican datos.
 */
export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
