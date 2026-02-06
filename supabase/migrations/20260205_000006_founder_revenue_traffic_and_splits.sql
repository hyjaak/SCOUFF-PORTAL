-- Founder dashboard: companies, orders, traffic, founder share rules, splits, functions, and RLS

create extension if not exists pgcrypto;

-- =========================
-- Core tables
-- =========================
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  buyer_id uuid null references auth.users(id),
  status text not null default 'pending',
  currency text not null default 'usd',
  gross_amount_cents integer not null default 0,
  net_amount_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid null references public.inventory_products(id) on delete set null,
  name text not null,
  qty integer not null default 1,
  unit_price_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.founder_share_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid null references public.companies(id) on delete cascade,
  founder_user_id uuid not null references auth.users(id) on delete cascade,
  share_bps integer not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, founder_user_id)
);

create table if not exists public.payment_splits (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  founder_user_id uuid not null references auth.users(id) on delete cascade,
  share_bps integer not null,
  gross_amount_cents integer not null,
  founder_amount_cents integer not null,
  company_amount_cents integer not null,
  provider text not null default 'unconfigured',
  provider_payment_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  company_id uuid null references public.companies(id) on delete set null,
  path text not null,
  referrer text null,
  user_agent text null,
  ip_hash text null,
  visitor_id text null,
  user_id uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_company_members_user on public.company_members(user_id);
create index if not exists idx_orders_company on public.orders(company_id);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_page_views_company on public.page_views(company_id);
create index if not exists idx_page_views_created_at on public.page_views(created_at);

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

create or replace function public.is_company_member(company uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select company is not null
    and exists (
      select 1 from public.company_members cm
      where cm.company_id = company
        and cm.user_id = auth.uid()
    );
$$;

create or replace function public.is_company_manager(company uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select company is not null
    and exists (
      select 1 from public.company_members cm
      where cm.company_id = company
        and cm.user_id = auth.uid()
        and lower(cm.role) = 'manager'
    );
$$;

create or replace function public.is_company_ceo(company uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select company is not null
    and exists (
      select 1 from public.company_members cm
      where cm.company_id = company
        and cm.user_id = auth.uid()
        and lower(cm.role) = 'ceo'
    );
$$;

create or replace function public.get_founder_share_bps(company uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select fsr.share_bps
      from public.founder_share_rules fsr
      where fsr.company_id = company
        and fsr.enabled = true
      limit 1
    ),
    (
      select fsr.share_bps
      from public.founder_share_rules fsr
      where fsr.company_id is null
        and fsr.enabled = true
      limit 1
    ),
    0
  );
$$;

create or replace function public.compute_split(company uuid, gross_cents int)
returns table(founder_cents int, company_cents int, bps int)
language sql
stable
security definer
set search_path = public
as $$
  select
    floor(coalesce(gross_cents, 0) * public.get_founder_share_bps(company) / 10000.0)::int as founder_cents,
    (coalesce(gross_cents, 0) - floor(coalesce(gross_cents, 0) * public.get_founder_share_bps(company) / 10000.0))::int as company_cents,
    public.get_founder_share_bps(company) as bps;
$$;

grant execute on function public.current_role() to anon, authenticated;
grant execute on function public.is_ceo() to anon, authenticated;
grant execute on function public.is_manager() to anon, authenticated;
grant execute on function public.has_feature(text) to anon, authenticated;
grant execute on function public.is_company_member(uuid) to anon, authenticated;
grant execute on function public.is_company_manager(uuid) to anon, authenticated;
grant execute on function public.is_company_ceo(uuid) to anon, authenticated;
grant execute on function public.get_founder_share_bps(uuid) to anon, authenticated;
grant execute on function public.compute_split(uuid, int) to anon, authenticated;

-- =========================
-- Seed default company + founder rule
-- =========================
do $$
declare
  founder_id uuid;
  default_company_id uuid;
begin
  -- Find founder by role or admin email
  select u.id
  into founder_id
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  where lower(coalesce(p.role, '')) in ('ceo', 'super_admin')
     or lower(u.email) = 'admin@scouff.com'
  limit 1;

  if founder_id is not null then
    insert into public.companies (name, slug)
    values ('SCOUFF', 'scouff')
    on conflict (slug) do update set name = excluded.name
    returning id into default_company_id;

    if default_company_id is null then
      select id into default_company_id from public.companies where slug = 'scouff' limit 1;
    end if;

    if default_company_id is not null then
      insert into public.company_members (company_id, user_id, role)
      values (default_company_id, founder_id, 'ceo')
      on conflict (company_id, user_id) do update set role = excluded.role;
    end if;

    insert into public.founder_share_rules (company_id, founder_user_id, share_bps, enabled)
    values (null, founder_id, 1000, true)
    on conflict (company_id, founder_user_id) do nothing;
  end if;
exception when others then
  null;
end $$;

-- Ensure CEO membership on all companies
do $$
declare
  founder_id uuid;
begin
  select u.id
  into founder_id
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  where lower(coalesce(p.role, '')) in ('ceo', 'super_admin')
     or lower(u.email) = 'admin@scouff.com'
  limit 1;

  if founder_id is not null then
    insert into public.company_members (company_id, user_id, role)
    select c.id, founder_id, 'ceo' from public.companies c
    on conflict (company_id, user_id) do update set role = excluded.role;
  end if;
exception when others then
  null;
end $$;

-- =========================
-- Inventory schema alignment (safety)
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

-- =========================
-- Views for aggregation
-- =========================
create or replace view public.v_company_sales_daily as
select
  o.company_id,
  date_trunc('day', o.created_at) as day,
  sum(o.gross_amount_cents) as gross_cents,
  count(*) as orders
from public.orders o
group by o.company_id, date_trunc('day', o.created_at);

create or replace view public.v_company_traffic_daily as
select
  pv.company_id,
  date_trunc('day', pv.created_at) as day,
  count(*) as page_views,
  count(distinct pv.visitor_id) as uniques_estimate
from public.page_views pv
group by pv.company_id, date_trunc('day', pv.created_at);

-- =========================
-- RLS policies
-- =========================
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.founder_share_rules enable row level security;
alter table public.payment_splits enable row level security;
alter table public.page_views enable row level security;

drop policy if exists "companies_select" on public.companies;
drop policy if exists "companies_write" on public.companies;
create policy "companies_select"
on public.companies
for select
using (public.is_ceo() or public.is_company_member(id));
create policy "companies_write"
on public.companies
for all
using (public.is_ceo())
with check (public.is_ceo());

drop policy if exists "company_members_select" on public.company_members;
drop policy if exists "company_members_write" on public.company_members;
create policy "company_members_select"
on public.company_members
for select
using (public.is_ceo() or public.is_company_member(company_id));
create policy "company_members_write"
on public.company_members
for all
using (public.is_ceo())
with check (public.is_ceo());

drop policy if exists "orders_select" on public.orders;
drop policy if exists "orders_write" on public.orders;
drop policy if exists "orders_delete" on public.orders;
create policy "orders_select"
on public.orders
for select
using (public.is_ceo() or public.is_company_member(company_id));
create policy "orders_write"
on public.orders
for insert, update
using (public.is_ceo() or public.is_company_manager(company_id))
with check (public.is_ceo() or public.is_company_manager(company_id));
create policy "orders_delete"
on public.orders
for delete
using (public.is_ceo());

drop policy if exists "order_items_select" on public.order_items;
drop policy if exists "order_items_write" on public.order_items;
drop policy if exists "order_items_delete" on public.order_items;
create policy "order_items_select"
on public.order_items
for select
using (
  public.is_ceo()
  or exists (
    select 1 from public.orders o
    where o.id = order_id and public.is_company_member(o.company_id)
  )
);
create policy "order_items_write"
on public.order_items
for insert, update
using (
  public.is_ceo()
  or exists (
    select 1 from public.orders o
    where o.id = order_id and public.is_company_manager(o.company_id)
  )
)
with check (
  public.is_ceo()
  or exists (
    select 1 from public.orders o
    where o.id = order_id and public.is_company_manager(o.company_id)
  )
);
create policy "order_items_delete"
on public.order_items
for delete
using (public.is_ceo());

drop policy if exists "founder_share_rules_select" on public.founder_share_rules;
drop policy if exists "founder_share_rules_write" on public.founder_share_rules;
create policy "founder_share_rules_select"
on public.founder_share_rules
for select
using (public.is_ceo());
create policy "founder_share_rules_write"
on public.founder_share_rules
for all
using (public.is_ceo())
with check (public.is_ceo());

drop policy if exists "payment_splits_select" on public.payment_splits;
drop policy if exists "payment_splits_write" on public.payment_splits;
drop policy if exists "payment_splits_delete" on public.payment_splits;
create policy "payment_splits_select"
on public.payment_splits
for select
using (public.is_ceo() or public.is_company_member(company_id));
create policy "payment_splits_write"
on public.payment_splits
for insert, update
using (public.is_ceo() or public.is_company_manager(company_id))
with check (public.is_ceo() or public.is_company_manager(company_id));
create policy "payment_splits_delete"
on public.payment_splits
for delete
using (public.is_ceo());

drop policy if exists "page_views_insert" on public.page_views;
drop policy if exists "page_views_select" on public.page_views;
create policy "page_views_insert"
on public.page_views
for insert
to anon, authenticated
with check (true);
create policy "page_views_select"
on public.page_views
for select
using (
  public.is_ceo()
  or public.is_company_member(company_id)
);
