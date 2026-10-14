-- Datos semilla: productos y precios de EJEMPLO del prototipo aprobado.
-- El dueño los reemplaza desde el panel de administración.

insert into public.categories (name, sort_order) values
  ('Lejías', 1),
  ('Detergentes', 2),
  ('Lavavajillas', 3),
  ('Desinfectantes y limpiadores', 4),
  ('Papel y bolsas', 5),
  ('Accesorios', 6);

insert into public.products (category_id, name, unit_price, pack_price, pack_label, sort_order)
select c.id, v.name, v.unit_price, v.pack_price, v.pack_label, v.sort_order
from (values
  ('Lejías',                       'Lejía tradicional 1 L',          3.20,  34.00, 'Caja x12', 1),
  ('Lejías',                       'Lejía tradicional galón 4 L',    9.50,  36.00, 'Caja x4',  2),
  ('Lejías',                       'Lejía con aroma 1 L',            3.80,  42.00, 'Caja x12', 3),
  ('Detergentes',                  'Detergente en polvo 900 g',      7.50,  84.00, 'Caja x12', 1),
  ('Detergentes',                  'Detergente en polvo 4.5 kg',    32.00, 122.00, 'Caja x4',  2),
  ('Detergentes',                  'Detergente en polvo saco 15 kg',95.00,   null,  null,      3),
  ('Lavavajillas',                 'Lavavajillas en pasta 900 g',    6.00,  66.00, 'Caja x12', 1),
  ('Lavavajillas',                 'Lavavajillas líquido galón',    18.00,  68.00, 'Caja x4',  2),
  ('Desinfectantes y limpiadores', 'Desinfectante lavanda 1 L',      4.50,  50.00, 'Caja x12', 1),
  ('Desinfectantes y limpiadores', 'Limpiatodo galón 4 L',          14.00,  52.00, 'Caja x4',  2),
  ('Desinfectantes y limpiadores', 'Ambientador en spray 360 ml',    8.50,  96.00, 'Caja x12', 3),
  ('Papel y bolsas',               'Papel higiénico paquete x4',     5.50,  62.00, 'Fardo x12',1),
  ('Papel y bolsas',               'Papel toalla paquete x2',        6.50,  72.00, 'Fardo x12',2),
  ('Papel y bolsas',               'Bolsas de basura 140 L (x10)',   6.00, 110.00, 'Caja x20', 3),
  ('Accesorios',                   'Escoba de plástico',             9.00,  96.00, 'Docena',   1),
  ('Accesorios',                   'Trapeador de algodón',          12.00, 130.00, 'Docena',   2),
  ('Accesorios',                   'Guantes de látex (par)',         4.50,  48.00, 'Docena',   3)
) as v(category, name, unit_price, pack_price, pack_label, sort_order)
join public.categories c on c.name = v.category;
