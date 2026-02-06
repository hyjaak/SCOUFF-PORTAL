-- Roles + feature permissions + inventory schema/RLS alignment

create extension if not exists pgcrypto;

-- =========================
-- Role feature permissions
-- =========================
create table if not exists public.role_feature_permissions (
  role text not null,
  feature text not null,
  enabled boolean not null default true,
  primary key (role, feature)
);

do $$
begin
  insert into public.role_feature_permissions (role, feature, enabled) values
    ('manager', 'inventory', true),
    ('manager', 'invites', true),
    ('manager', 'auctions', true),
    ('manager', 'settings', false),
    ('manager', 'admin', false),
    ('manager', 'deals', false),
    ('member', 'inventory', false),
    ('member', 'invites', false),
    ('member', 'auctions', false),
    ('member', 'settings', false),
    ('member', 'admin', false),
    ('member', 'deals', false)
  on conflict (role, feature) do update set enabled = excluded.enabled;
exception when others then
  null;
end $$;

-- =========================
-- Role helpers (normalized)
-- =========================
create or replace function public.current_role()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  role_text text;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'user_id'
  ) then
    select role into role_text from public.profiles where user_id = auth.uid() limit 1;
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'id'
  ) then
    select role into role_text from public.profiles where id = auth.uid() limit 1;
  else
    role_text := null;
  end if;

  role_text := lower(coalesce(role_text, 'member'));

  if role_text in ('super_admin', 'ceo', 'business_owner') then
    return 'ceo';
  elsif role_text in ('admin', 'manager') then
    return 'manager';
  elsif role_text = 'member' then
    return 'member';
  end if;

  return 'member';
end;
$$;

create or replace function public.is_ceo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'ceo';
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'manager';
$$;

create or replace function public.has_feature(feature_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when public.is_ceo() then true
      else exists (
        select 1
        from public.role_feature_permissions rfp
        where rfp.role = public.current_role()
          and rfp.feature = feature_name
          and rfp.enabled = true
      )
    end;
$$;

grant execute on function public.current_role() to anon, authenticated;
grant execute on function public.is_ceo() to anon, authenticated;
grant execute on function public.is_manager() to anon, authenticated;
grant execute on function public.has_feature(text) to anon, authenticated;

-- =========================
-- Inventory schema alignment
-- =========================
alter table if exists public.inventory_products
  add column if not exists sku text,
  add column if not exists name text,
  add column if not exists category text,
  add column if not exists quantity integer,
  add column if not exists retail_price numeric(10,2),
  add column if not exists status text,
  add column if not exists description text,
  add column if not exists access_level text,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.inventory_products
set
  sku = coalesce(sku, 'SKU-' || upper(substr(replace(gen_random_uuid()::text, '-' , ''), 1, 8))),
  quantity = coalesce(quantity, 0),
  retail_price = coalesce(retail_price, 0),
  status = coalesce(status, 'Active'),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  sku is null
  or quantity is null
  or retail_price is null
  or status is null
  or created_at is null
  or updated_at is null;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='inventory_products' and column_name='sku') then
    execute 'alter table public.inventory_products alter column sku set default (''SKU-'' || upper(substr(replace(gen_random_uuid()::text, ''-'', ''''), 1, 8)))';
    execute 'alter table public.inventory_products alter column sku set not null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='inventory_products' and column_name='name') then
    execute 'alter table public.inventory_products alter column name set not null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='inventory_products' and column_name='category') then
    execute 'alter table public.inventory_products alter column category set not null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='inventory_products' and column_name='quantity') then
    execute 'alter table public.inventory_products alter column quantity set default 0';
    execute 'alter table public.inventory_products alter column quantity set not null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='inventory_products' and column_name='retail_price') then
    execute 'alter table public.inventory_products alter column retail_price set default 0';
    execute 'alter table public.inventory_products alter column retail_price set not null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='inventory_products' and column_name='status') then
    execute 'alter table public.inventory_products alter column status set default ''Active''';
    execute 'alter table public.inventory_products alter column status set not null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='inventory_products' and column_name='created_at') then
    execute 'alter table public.inventory_products alter column created_at set default now()';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='inventory_products' and column_name='updated_at') then
    execute 'alter table public.inventory_products alter column updated_at set default now()';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname='public' and indexname='inventory_products_sku_key'
  ) then
    begin
      execute 'create unique index inventory_products_sku_key on public.inventory_products (sku)';
    exception when others then
      null;
    end;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='inventory_products' and column_name='updated_at'
  ) then
    execute $q$
      create or replace function public.set_inventory_products_updated_at()
      returns trigger
      language plpgsql
      as $fn$
      begin
        new.updated_at = now();
        return new;
      end;
      $fn$;
    $q$;

    if not exists (
      select 1 from pg_trigger where tgname='trg_inventory_products_updated_at'
    ) then
      execute 'create trigger trg_inventory_products_updated_at before update on public.inventory_products for each row execute function public.set_inventory_products_updated_at()';
    end if;
  end if;
end $$;

-- =========================
-- Inventory RLS policies
-- =========================
alter table public.inventory_products enable row level security;

drop policy if exists "inventory_select_auth" on public.inventory_products;
drop policy if exists "inventory_insert_auth" on public.inventory_products;
drop policy if exists "inventory_update_auth" on public.inventory_products;
drop policy if exists "inventory_delete_auth" on public.inventory_products;
drop policy if exists "inventory_insert_ceo_manager" on public.inventory_products;

drop policy if exists "inventory_select_feature" on public.inventory_products;
drop policy if exists "inventory_insert_feature" on public.inventory_products;
drop policy if exists "inventory_update_feature" on public.inventory_products;
drop policy if exists "inventory_delete_feature" on public.inventory_products;

create policy "inventory_select_feature"
on public.inventory_products
for select
using (
  public.has_feature('inventory')
  and (public.is_ceo() or public.is_manager())
);

create policy "inventory_insert_feature"
on public.inventory_products
for insert
with check (
  public.has_feature('inventory')
  and (public.is_ceo() or public.is_manager())
);

create policy "inventory_update_feature"
on public.inventory_products
for update
using (
  public.has_feature('inventory')
  and (public.is_ceo() or public.is_manager())
)
with check (
  public.has_feature('inventory')
  and (public.is_ceo() or public.is_manager())
);

create policy "inventory_delete_feature"
on public.inventory_products
for delete
using (
  public.has_feature('inventory')
  and (public.is_ceo() or public.is_manager())
);
