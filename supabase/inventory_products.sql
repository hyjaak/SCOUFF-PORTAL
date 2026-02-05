-- Inventory Intelligence: Physical Asset Table
-- 1. Create inventory table
create table if not exists public.inventory_products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  codename text not null,
  category text not null,
  description text,
  quantity integer not null default 0,
  status text not null default 'locked' check (status in ('locked', 'preview', 'live')),
  access_level text not null default 'ceo' check (access_level in ('ceo', 'member', 'invite')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Enable Row Level Security
alter table public.inventory_products enable row level security;

-- 3. CEO full access policy
create policy "ceo_full_access_inventory"
on public.inventory_products
for all
using (
  auth.jwt() ->> 'role' = 'ceo'
)
with check (
  auth.jwt() ->> 'role' = 'ceo'
);

-- 4. Member read-only (non-locked items)
create policy "member_read_inventory"
on public.inventory_products
for select
using (
  auth.jwt() ->> 'role' = 'member'
  and status <> 'locked'
);

-- 5. Default deny everything else
-- (implicit via RLS)

-- 6. Trigger to auto-update updated_at
create or replace function public.set_inventory_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_inventory_updated_at on public.inventory_products;

create trigger set_inventory_updated_at
before update on public.inventory_products
for each row
execute function public.set_inventory_updated_at();

-- 7. Pricing (idempotent)
alter table public.inventory_products
  add column if not exists retail_price numeric;

-- Ensure PostgREST/Supabase schema cache refresh after column changes
notify pgrst, 'reload schema';
