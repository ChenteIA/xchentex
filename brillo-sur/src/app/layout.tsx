import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// next/font descarga Geist en el build y la sirve desde el propio dominio.
const geist = Geist({ variable: "--font-geist", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Distribuidora Brillo Sur · Limpieza al por mayor",
  description:
    "Lejía, detergentes y desinfectantes al por mayor en Mala, Cañete. Arma tu pedido y envíalo por WhatsApp.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
