# Lo que el dueño debe hacer por su cuenta

## Antes de publicar (imprescindible)

- [ ] **Crear las cuentas** en Supabase, Vercel y Cloudflare (planes gratuitos).
- [ ] **Configurar Supabase** según el README §4: aplicar migraciones, **desactivar el registro público**, dejar **activo el proveedor Email**, contraseña mínima de **10 caracteres** y *Site URL* con el dominio.
- [ ] **Crear el primer usuario dueño** (README §5).
- [ ] **Crear el widget de Turnstile** con los dominios del sitio (README §6).
- [ ] **Generar y guardar `PHONE_ENCRYPTION_KEY`** en un gestor de contraseñas. Si se pierde, los celulares guardados no se podrán leer.
- [ ] **Cargar las 8 variables de entorno en Vercel** y desplegar (README §7).
- [ ] **Número de WhatsApp real** del negocio en `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- [ ] **Comprar el dominio `.pe`** (por ejemplo en [punto.pe](https://punto.pe) o un registrador autorizado), agregarlo en Vercel y crear los registros DNS que indique.
- [ ] Correr `npm run test:rls:remote` contra el proyecto real y confirmar que todo sale `ok`.

## Contenido del sitio

- [ ] **Precios y productos reales**: reemplazar los de ejemplo desde **Panel → Productos** (o no cargar `seed.sql` y crearlos desde cero).
- [ ] **Fotos reales** de cada producto (JPG/PNG/WebP, hasta 2 MB; fondo claro y producto centrado se ven mejor).
- [ ] **Dirección del almacén** y **horarios** en `src/lib/business.ts`.
- [ ] **Zonas de reparto** y **monto de reparto gratis** (S/ 150) en el mismo archivo, si cambian.
- [ ] **Mapa**: reemplazar el espacio "Mapa de Google" por un enlace o imagen de la ubicación (si se inserta un mapa embebido de Google, hay que permitir `https://www.google.com` en `frame-src` de `src/lib/security/csp.ts`).
- [ ] **Reseñas**: hoy dicen "Reseña de ejemplo". Reemplazarlas por reseñas reales, **con permiso** de cada cliente, en `src/components/landing/Sections.tsx`, o quitar la sección.
- [ ] **Beneficios** (crédito a 7/15 días, boleta o factura): confirmar que el negocio realmente los ofrece.

## Legal (Perú)

- [ ] **Libro de Reclamaciones virtual** (obligatorio para negocios que venden en línea, Indecopi): habilitarlo y enlazarlo en `/libro-de-reclamaciones`.
- [ ] **Política de privacidad**: completar razón social, RUC, dirección y un contacto en `/privacidad` (`src/app/privacidad/page.tsx`) y revisarla con un asesor.
- [ ] **Banco de datos personales**: evaluar con un asesor la inscripción ante la Autoridad Nacional de Protección de Datos Personales (Ley 29733), ya que se guardan celulares de clientes.

## Operación y mantenimiento

- [ ] Crear las cuentas del personal desde **Panel → Usuarios** (una por persona, nunca compartir contraseñas).
- [ ] Cuando alguien deje de trabajar en el negocio, **desmarcar "Activo"** en Panel → Usuarios.
- [ ] Activar la **verificación en dos pasos (2FA)** en GitHub, Vercel, Supabase y Cloudflare.
- [ ] Revisar y aceptar los **PR de Dependabot** (llegan cada semana) cuando el CI esté en verde.
- [ ] Revisar de vez en cuando los **logs de Vercel** (intentos de login bloqueados, errores).
- [ ] Supabase gratis pausa el proyecto tras ~1 semana sin actividad; si el tráfico es bajo, considerar el plan Pro o entrar al panel con regularidad.
- [ ] **Respaldos**: el plan gratuito no incluye copias diarias descargables; exportar los pedidos periódicamente o pasar al plan Pro.
