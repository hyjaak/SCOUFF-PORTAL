-- Migration: Roles & RLS (merged from manual_apply_roles_rls.sql)
begin;

-- (Entire contents copied from manual_apply_roles_rls.sql)

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  created_by uuid null
);

create table if not exists public.company_memberships (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  created_by uuid null
);
create unique index if not exists invites_company_email_unique
  on public.invites(company_id, lower(email));

create table if not exists public.role_features (
  company_id uuid not null references public.companies(id) on delete cascade,
  role text not null,
  feature text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid null,
  primary key (company_id, role, feature)
);

create table if not exists public.platform_settings (
  id int primary key default 1,
  founder_share_bps int not null default 500,
  updated_at timestamptz not null default now()
);
insert into public.platform_settings(id) values (1)
on conflict (id) do nothing;

create table if not exists public.inventory_products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sku text not null,
  name text not null,
  category text null,
  quantity int not null default 0,
  retail_price numeric(12,2) not null default 0,
  status text not null default 'active',
  description text null,
  created_at timestamptz not null default now(),
  created_by uuid null
);
create index if not exists inventory_products_company_id_idx on public.inventory_products(company_id);
create unique index if not exists inventory_products_company_sku_unique on public.inventory_products(company_id, sku);

create table if not exists public.auctions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text null,
  status text not null default 'draft',
  starts_at timestamptz null,
  ends_at timestamptz null,
  created_at timestamptz not null default now(),
  created_by uuid null
);
create index if not exists auctions_company_id_idx on public.auctions(company_id);

create or replace function public.current_role(p_company_id uuid)
returns text
language sql
stable
security definer
as $$
  select coalesce(
    (select role from public.company_memberships
      where company_id = p_company_id and user_id = auth.uid()
      limit 1),
    'member'
  );
$$;

create or replace function public.is_ceo(p_company_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select public.current_role(p_company_id) = 'ceo';
$$;

create or replace function public.is_manager(p_company_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select public.current_role(p_company_id) = 'manager';
$$;

create or replace function public.has_feature(p_company_id uuid, p_feature text)
returns boolean
language sql
stable
security definer
as $$
  select
    case
      when public.is_ceo(p_company_id) then true
      when public.is_manager(p_company_id) then coalesce(
        (select enabled from public.role_features
          where company_id = p_company_id and role = 'manager' and feature = p_feature
          limit 1),
        true
      )
      else false
    end;
$$;

alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.invites enable row level security;
alter table public.role_features enable row level security;
alter table public.inventory_products enable row level security;
alter table public.auctions enable row level security;
alter table public.platform_settings enable row level security;

drop policy if exists "companies_select" on public.companies;
create policy "companies_select" on public.companies
for select to authenticated
using (exists (
  select 1 from public.company_memberships m
  where m.company_id = companies.id and m.user_id = auth.uid()
));

drop policy if exists "companies_insert" on public.companies;
create policy "companies_insert" on public.companies
for insert to authenticated
with check (true);

drop policy if exists "companies_update_ceo" on public.companies;
create policy "companies_update_ceo" on public.companies
for update to authenticated
using (public.is_ceo(companies.id))
with check (public.is_ceo(companies.id));

drop policy if exists "memberships_select" on public.company_memberships;
create policy "memberships_select" on public.company_memberships
for select to authenticated
using (exists (
  select 1 from public.company_memberships m
  where m.company_id = company_memberships.company_id and m.user_id = auth.uid()
));

drop policy if exists "memberships_manage_ceo" on public.company_memberships;
create policy "memberships_manage_ceo" on public.company_memberships
for all to authenticated
using (public.is_ceo(company_memberships.company_id))
with check (public.is_ceo(company_memberships.company_id));

drop policy if exists "invites_manage_ceo" on public.invites;
create policy "invites_manage_ceo" on public.invites
for all to authenticated
using (public.is_ceo(invites.company_id))
with check (public.is_ceo(invites.company_id));

drop policy if exists "role_features_manage_ceo" on public.role_features;
create policy "role_features_manage_ceo" on public.role_features
for all to authenticated
using (public.is_ceo(role_features.company_id))
with check (public.is_ceo(role_features.company_id));

drop policy if exists "platform_settings_read" on public.platform_settings;
create policy "platform_settings_read" on public.platform_settings
for select to authenticated
using (true);

drop policy if exists "platform_settings_write_none" on public.platform_settings;
create policy "platform_settings_write_none" on public.platform_settings
for update to authenticated
using (false)
with check (false);

drop policy if exists "inventory_select" on public.inventory_products;
create policy "inventory_select" on public.inventory_products
for select to authenticated
using (
  exists (
    select 1 from public.company_memberships m
    where m.company_id = inventory_products.company_id and m.user_id = auth.uid()
  )
  and public.has_feature(inventory_products.company_id, 'inventory')
);

drop policy if exists "inventory_insert" on public.inventory_products;
create policy "inventory_insert" on public.inventory_products
for insert to authenticated
with check (
  exists (
    select 1 from public.company_memberships m
    where m.company_id = inventory_products.company_id and m.user_id = auth.uid()
  )
  and public.has_feature(inventory_products.company_id, 'inventory')
);

drop policy if exists "inventory_update" on public.inventory_products;
create policy "inventory_update" on public.inventory_products
for update to authenticated
using (
  exists (
    select 1 from public.company_memberships m
    where m.company_id = inventory_products.company_id and m.user_id = auth.uid()
  )
  and public.has_feature(inventory_products.company_id, 'inventory')
)
with check (
  exists (
    select 1 from public.company_memberships m
    where m.company_id = inventory_products.company_id and m.user_id = auth.uid()
  )
  and public.has_feature(inventory_products.company_id, 'inventory')
);

drop policy if exists "inventory_delete" on public.inventory_products;
create policy "inventory_delete" on public.inventory_products
for delete to authenticated
using (
  exists (
    select 1 from public.company_memberships m
    where m.company_id = inventory_products.company_id and m.user_id = auth.uid()
  )
  and public.has_feature(inventory_products.company_id, 'inventory')
);

drop policy if exists "auctions_select" on public.auctions;
create policy "auctions_select" on public.auctions
for select to authenticated
using (
  exists (
    select 1 from public.company_memberships m
    where m.company_id = auctions.company_id and m.user_id = auth.uid()
  )
  and public.has_feature(auctions.company_id, 'auctions')
);

drop policy if exists "auctions_insert" on public.auctions;
create policy "auctions_insert" on public.auctions
for insert to authenticated
with check (
  exists (
    select 1 from public.company_memberships m
    where m.company_id = auctions.company_id and m.user_id = auth.uid()
  )
  and public.has_feature(auctions.company_id, 'auctions')
);

commit;

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.inventory_products to authenticated;
grant select, insert, update, delete on public.auctions to authenticated;
grant select, insert, update, delete on public.invites to authenticated;
grant select, insert, update, delete on public.role_features to authenticated;
grant select, insert, update, delete on public.company_memberships to authenticated;
grant select, insert, update, delete on public.companies to authenticated;
grant select on public.platform_settings to authenticated;

grant execute on function public.current_role(uuid) to authenticated;
grant execute on function public.is_ceo(uuid) to authenticated;
grant execute on function public.is_manager(uuid) to authenticated;
grant execute on function public.has_feature(uuid, text) to authenticated;
