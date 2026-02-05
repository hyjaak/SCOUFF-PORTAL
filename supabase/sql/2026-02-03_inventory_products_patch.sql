-- SCOUFF Inventory schema patch (idempotent)
-- Fixes missing columns that UI expects and stops PostgREST schema-cache column errors.

create extension if not exists pgcrypto;

-- Ensure table exists (DO NOT drop or recreate)
-- If table already exists, this does nothing.
create table if not exists public.inventory_products (
  id uuid primary key default gen_random_uuid()
);

-- Add expected columns if missing
alter table public.inventory_products
  add column if not exists sku text,
  add column if not exists name text,
  add column if not exists category text,
  add column if not exists description text,
  add column if not exists quantity integer not null default 0,
  add column if not exists unit_cost numeric(10,2),
  add column if not exists retail_price numeric(10,2) not null default 0,
  add column if not exists status text not null default 'draft',
  add column if not exists access_level text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Backfill sku for existing rows if sku is null/empty:
update public.inventory_products
set sku = coalesce(nullif(sku,''), 'SKU-' || upper(substring(replace(gen_random_uuid()::text,'-',''), 1, 8)))
where sku is null or sku = '';

-- Make SKU unique (safe add)
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname='public'
      and indexname='inventory_products_sku_key'
  ) then
    create unique index inventory_products_sku_key on public.inventory_products (sku);
  end if;
end$$;

-- Enforce allowed status values (safe constraint add)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_products_status_check'
  ) then
    alter table public.inventory_products
      add constraint inventory_products_status_check
      check (status in ('draft','active','archived'));
  end if;
end$$;

-- Update updated_at automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists trg_inventory_products_updated_at on public.inventory_products;
create trigger trg_inventory_products_updated_at
before update on public.inventory_products
for each row execute function public.set_updated_at();

-- Force PostgREST/Supabase schema cache reload
notify pgrst, 'reload schema';
