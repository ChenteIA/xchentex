#!/usr/bin/env bash
# Ejecuta las pruebas de RLS contra un Postgres local (sin Docker).
# Crea una base temporal, simula lo mínimo de Supabase, aplica migraciones
# + seed y corre supabase/tests/*.test.sql con pgTAP.
#
# Requisitos: Postgres 15+ con pgcrypto y pgTAP instalados.
# Conexión: variables estándar de psql (PGHOST, PGPORT, PGUSER) con un superusuario.
# Con el CLI de Supabase y Docker también puedes usar:  supabase test db
set -euo pipefail
cd "$(dirname "$0")/.."

DB="brillo_sur_test_$$"
psql -v ON_ERROR_STOP=1 -q -d postgres -c "create database $DB" >/dev/null
trap 'psql -q -d postgres -c "drop database if exists $DB" >/dev/null' EXIT

run() { psql -v ON_ERROR_STOP=1 -q -X -d "$DB" "$@"; }

run -f supabase/tests/_shim_supabase.sql >/dev/null
for f in supabase/migrations/*.sql; do run -f "$f" >/dev/null; done
run -f supabase/seed.sql >/dev/null

status=0
for t in supabase/tests/*.test.sql; do
  echo "== $t"
  out="$(run -t -A -f "$t")"
  echo "$out"
  if grep -qE '^not ok|# Looks like' <<<"$out"; then status=1; fi
done

if [ $status -eq 0 ]; then echo "Todas las pruebas pasaron."; else echo "HAY PRUEBAS FALLIDAS." >&2; fi
exit $status
