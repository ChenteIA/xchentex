"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "../admin.module.css";

export function AdminNav({ isOwner }: { isOwner: boolean }) {
  const path = usePathname();
  const links = [
    { href: "/admin/pedidos", label: "Pedidos" },
    { href: "/admin/productos", label: "Productos" },
    { href: "/admin/categorias", label: "Categorías" },
    // Ocultar el enlace es solo comodidad: la página y sus acciones verifican el rol en el servidor.
    ...(isOwner ? [{ href: "/admin/usuarios", label: "Usuarios" }] : []),
    { href: "/admin/cuenta", label: "Mi cuenta" },
  ];
  return (
    <nav className={s.nav} aria-label="Panel">
      <div className={s.navInner}>
        {links.map((l) => {
          const active = path === l.href || path.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={active ? s.navLinkActive : s.navLink}
              aria-current={active ? "page" : undefined}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
