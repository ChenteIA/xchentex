import { requireOwner } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NewUserForm, UserRow } from "./UserForms";
import s from "../../admin.module.css";

export default async function UsuariosPage() {
  // La página entera es solo para el dueño: se verifica en el servidor, no solo ocultando el enlace.
  const owner = await requireOwner();
  const { data: profiles } = await owner.supabase
    .from("profiles")
    .select("id, role, active, full_name, created_at")
    .order("created_at");

  // Los correos viven en Supabase Auth; se leen con la clave de servicio tras verificar al dueño.
  const { data: authUsers } = await createAdminClient().auth.admin.listUsers({ perPage: 200 });
  const emailById = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? ""]));

  return (
    <>
      <h1 className={s.h1}>Usuarios</h1>
      <section className={s.panel} aria-labelledby="nuevo-t">
        <h2 id="nuevo-t" className={s.h2}>
          Nuevo usuario
        </h2>
        <NewUserForm />
      </section>
      <ul className={s.list}>
        {(profiles ?? []).map((p) => (
          <li key={p.id}>
            <UserRow
              id={p.id}
              email={emailById.get(p.id) ?? ""}
              fullName={p.full_name}
              role={p.role}
              active={p.active}
              isSelf={p.id === owner.id}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
