-- Ensure required extensions
create extension if not exists pgcrypto;

-- Align columns for inventory_products
alter table if exists public.inventory_products
  add column if not exists sku text,
  add column if not exists retail_price numeric(12,2),
  add column if not exists access_level text;

-- If a legacy column exists that looks like a SKU (codename), copy it into sku if sku is null
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='inventory_products' and column_name='codename'
  ) then
    execute 'update public.inventory_products set sku = coalesce(sku, codename) where sku is null;';
  end if;
end $$;

-- Defaults (safe)
alter table public.inventory_products
  alter column sku set default ('SKU-' || upper(substr(replace(gen_random_uuid()::text, ''-'', ''''), 1, 8))),
  alter column retail_price set default 0,
  alter column access_level set default 'member';

-- Not-null constraints where appropriate (only if column exists)
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='inventory_products' and column_name='name') then
    execute 'alter table public.inventory_products alter column name set not null;';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='inventory_products' and column_name='quantity') then
    execute 'alter table public.inventory_products alter column quantity set not null;';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='inventory_products' and column_name='status') then
    execute 'alter table public.inventory_products alter column status set not null;';
  end if;
end $$;

-- Unique SKU (best-effort; avoid failing if duplicates already exist)
do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname='public' and indexname='inventory_products_sku_key'
  ) then
    begin
      execute 'create unique index inventory_products_sku_key on public.inventory_products (sku);';
    exception when others then
      -- ignore if duplicates exist; UI will still work
      null;
    end;
  end if;
end $$;

-- RLS
alter table public.inventory_products enable row level security;

-- Policies (drop+recreate for idempotency)
drop policy if exists "inventory_select_auth" on public.inventory_products;
drop policy if exists "inventory_insert_auth" on public.inventory_products;
drop policy if exists "inventory_update_auth" on public.inventory_products;
drop policy if exists "inventory_delete_auth" on public.inventory_products;

create policy "inventory_select_auth"
on public.inventory_products
for select
to authenticated
using (true);

create policy "inventory_insert_auth"
on public.inventory_products
for insert
to authenticated
with check (true);

create policy "inventory_update_auth"
on public.inventory_products
for update
to authenticated
using (true)
with check (true);

create policy "inventory_delete_auth"
on public.inventory_products
for delete
to authenticated
using (true);

-- Optional: if table has updated_at, keep it fresh
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='inventory_products' and column_name='updated_at'
  ) then
    execute $q$
      create or replace function public.set_updated_at()
      returns trigger
      language plpgsql
      as $fn$
      begin
        new.updated_at = now();
        return new;
      end;
      $fn$;
    $q$;

    -- attach trigger if not exists
    if not exists (
      select 1 from pg_trigger where tgname='trg_inventory_products_updated_at'
    ) then
      execute 'create trigger trg_inventory_products_updated_at before update on public.inventory_products for each row execute function public.set_updated_at();';
    end if;
  end if;
end $$;
