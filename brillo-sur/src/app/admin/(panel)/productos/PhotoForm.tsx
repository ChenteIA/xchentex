"use client";

import Image from "next/image";
import { useActionState, useTransition } from "react";
import type { FormState } from "./actions";
import s from "../../admin.module.css";

export function PhotoForm({
  imageUrl,
  name,
  upload,
  remove,
}: {
  imageUrl: string | null;
  name: string;
  upload: (prev: FormState, fd: FormData) => Promise<FormState>;
  remove: () => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(upload, { error: null });
  const [removing, startRemove] = useTransition();
  return (
    <form action={formAction} className={s.form}>
      {imageUrl ? (
        <Image src={imageUrl} alt={`Foto de ${name}`} width={160} height={160} className={s.photoPreview} />
      ) : (
        <div className={s.photoPreview} role="img" aria-label="Sin foto" />
      )}
      <label className={s.field}>
        <span className={s.label}>Nueva foto (JPG, PNG o WebP, hasta 2 MB)</span>
        <input className={s.input} type="file" name="photo" accept="image/jpeg,image/png,image/webp" required />
      </label>
      {state.error && (
        <p className={s.error} role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className={s.ok} role="status">
          {state.ok}
        </p>
      )}
      <div className={s.rowSide}>
        <button className={s.btnPrimary} type="submit" disabled={pending}>
          {pending ? "Subiendo…" : "Subir foto"}
        </button>
        {imageUrl && (
          <button
            className={s.btnSecondary}
            type="button"
            disabled={removing}
            onClick={() => startRemove(async () => void (await remove()))}
          >
            Quitar foto
          </button>
        )}
      </div>
    </form>
  );
}
