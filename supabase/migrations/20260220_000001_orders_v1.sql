begin;

-- Orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid null references auth.users(id) on delete set null,
  status text not null default 'pending', -- pending|paid|fulfilled|cancelled|refunded
  currency text not null default 'USD',
  gross_amount_cents integer not null default 0, -- gross in cents to avoid floating point
  platform_fee_cents integer not null default 0, -- founder share
  net_amount_cents integer not null default 0, -- net = gross - platform_fee
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_company_id_idx on public.orders(company_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

-- Order items table
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid null references public.inventory_products(id) on delete set null,
  sku text null,
  name text not null,
  qty integer not null default 1,
  unit_price_cents integer not null default 0,
  line_total_cents integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

-- Enable RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Orders policies
drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders
for select to authenticated
using (
  exists (
    select 1 from public.company_memberships m
    where m.company_id = orders.company_id and m.user_id = auth.uid()
  )
);

drop policy if exists "orders_insert" on public.orders;
create policy "orders_insert" on public.orders
for insert to authenticated
with check (
  exists (
    select 1 from public.company_memberships m
    where m.company_id = orders.company_id and m.user_id = auth.uid()
      and (m.role = 'manager' or m.role = 'ceo')
  )
);

drop policy if exists "orders_update" on public.orders;
create policy "orders_update" on public.orders
for update to authenticated
using (
  exists (
    select 1 from public.company_memberships m
    where m.company_id = orders.company_id and m.user_id = auth.uid()
      and (m.role = 'manager' or m.role = 'ceo')
  )
)
with check (
  exists (
    select 1 from public.company_memberships m
    where m.company_id = orders.company_id and m.user_id = auth.uid()
      and (m.role = 'manager' or m.role = 'ceo')
  )
);

drop policy if exists "orders_delete" on public.orders;
create policy "orders_delete" on public.orders
for delete to authenticated
using (
  exists (
    select 1 from public.company_memberships m
    where m.company_id = orders.company_id and m.user_id = auth.uid()
      and m.role = 'ceo'
  )
);

-- Order items policies (inherit permissions from order)
drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items
for select to authenticated
using (
  exists (
    select 1 from public.orders o
      join public.company_memberships m on o.company_id = m.company_id
    where o.id = order_items.order_id and m.user_id = auth.uid()
  )
);

drop policy if exists "order_items_insert" on public.order_items;
create policy "order_items_insert" on public.order_items
for insert to authenticated
with check (
  exists (
    select 1 from public.orders o
      join public.company_memberships m on o.company_id = m.company_id
    where o.id = order_items.order_id and m.user_id = auth.uid()
      and (m.role = 'manager' or m.role = 'ceo')
  )
);

drop policy if exists "order_items_update" on public.order_items;
create policy "order_items_update" on public.order_items
for update to authenticated
using (
  exists (
    select 1 from public.orders o
      join public.company_memberships m on o.company_id = m.company_id
    where o.id = order_items.order_id and m.user_id = auth.uid()
      and (m.role = 'manager' or m.role = 'ceo')
  )
)
with check (
  exists (
    select 1 from public.orders o
      join public.company_memberships m on o.company_id = m.company_id
    where o.id = order_items.order_id and m.user_id = auth.uid()
      and (m.role = 'manager' or m.role = 'ceo')
  )
);

drop policy if exists "order_items_delete" on public.order_items;
create policy "order_items_delete" on public.order_items
for delete to authenticated
using (
  exists (
    select 1 from public.orders o
      join public.company_memberships m on o.company_id = m.company_id
    where o.id = order_items.order_id and m.user_id = auth.uid()
      and m.role = 'ceo'
  )
);

commit;

-- Grants
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
