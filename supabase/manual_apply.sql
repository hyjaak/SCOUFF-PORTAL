-- Role helpers + inventory RLS (CEO/Manager) + company feature toggles

-- Feature toggles (company-scoped)
create table if not exists public.company_features (
  company_id uuid not null references public.companies(id) on delete cascade,
  feature text not null,
  enabled boolean not null default false,
  primary key (company_id, feature)
);

-- Current role (compat: user_id or id)
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

  if role_text in ('super_admin', 'ceo') then
    return 'ceo';
  elsif role_text in ('business_owner', 'manager', 'admin') then
    return 'manager';
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
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  role_text text;
  has_table boolean;
  has_company_feature boolean;
  has_company_setting boolean;
  has_role_table boolean;
  role_enabled boolean;
begin
  role_text := public.current_role();

  if role_text = 'ceo' then
    return true;
  end if;

  select exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'company_features'
  ) into has_table;

  if has_table then
    select exists (
      select 1
      from public.company_features cf
      join public.company_members cm on cm.company_id = cf.company_id
      where cm.user_id = auth.uid()
        and cf.feature = feature_name
        and cf.enabled = true
    ) into has_company_feature;

    if has_company_feature then
      return true;
    end if;

    select exists (
      select 1
      from public.company_features cf
      join public.company_members cm on cm.company_id = cf.company_id
      where cm.user_id = auth.uid()
        and cf.feature = feature_name
    ) into has_company_setting;

    if has_company_setting then
      return false;
    end if;
  end if;

  select exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'role_feature_permissions'
  ) into has_role_table;

  if role_text = 'member' then
    if has_role_table then
      select rfp.enabled
      into role_enabled
      from public.role_feature_permissions rfp
      where rfp.role = 'member'
        and rfp.feature = feature_name
      limit 1;
      if role_enabled is not null then
        return role_enabled;
      end if;
    end if;
    return true;
  end if;

  if has_role_table then
    return exists (
      select 1
      from public.role_feature_permissions rfp
      where rfp.role = role_text
        and rfp.feature = feature_name
        and rfp.enabled = true
    );
  end if;

  if not has_table and not has_role_table then
    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.current_role() to anon, authenticated;
grant execute on function public.is_ceo() to anon, authenticated;
grant execute on function public.is_manager() to anon, authenticated;
grant execute on function public.has_feature(text) to anon, authenticated;

-- Inventory RLS policies
alter table public.inventory_products
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists created_by uuid references auth.users(id);

alter table public.inventory_products enable row level security;

drop policy if exists "inventory_select_feature" on public.inventory_products;
drop policy if exists "inventory_insert_feature" on public.inventory_products;
drop policy if exists "inventory_update_feature" on public.inventory_products;
drop policy if exists "inventory_delete_feature" on public.inventory_products;
drop policy if exists "inventory_select_auth" on public.inventory_products;
drop policy if exists "inventory_insert_auth" on public.inventory_products;
drop policy if exists "inventory_update_auth" on public.inventory_products;
drop policy if exists "inventory_delete_auth" on public.inventory_products;
drop policy if exists "inventory_insert_ceo_manager" on public.inventory_products;

create policy "inventory_select_feature"
on public.inventory_products
for select
using (
  public.has_feature('inventory')
  and (
    public.is_ceo()
    or exists (
      select 1 from public.company_members cm
      where cm.user_id = auth.uid()
        and cm.company_id = inventory_products.company_id
    )
  )
);

create policy "inventory_insert_feature"
on public.inventory_products
for insert
with check (
  public.has_feature('inventory')
  and (public.is_ceo() or public.is_manager())
  and exists (
    select 1 from public.company_members cm
    where cm.user_id = auth.uid()
      and cm.company_id = inventory_products.company_id
  )
  and (inventory_products.created_by = auth.uid())
);

create policy "inventory_update_feature"
on public.inventory_products
for update
using (
  public.has_feature('inventory')
  and (public.is_ceo() or public.is_manager())
  and exists (
    select 1 from public.company_members cm
    where cm.user_id = auth.uid()
      and cm.company_id = inventory_products.company_id
  )
)
with check (
  public.has_feature('inventory')
  and (public.is_ceo() or public.is_manager())
  and exists (
    select 1 from public.company_members cm
    where cm.user_id = auth.uid()
      and cm.company_id = inventory_products.company_id
  )
  and (inventory_products.created_by = auth.uid())
);

create policy "inventory_delete_feature"
on public.inventory_products
for delete
using (
  public.is_ceo()
);
