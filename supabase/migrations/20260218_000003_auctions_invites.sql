-- minimal auctions and invites tables
create table if not exists public.auctions (
  id uuid default gen_random_uuid() primary key,
  title text,
  description text,
  status text default 'draft',
  starting_price numeric,
  created_at timestamptz default now()
);

create table if not exists public.invites (
  id uuid default gen_random_uuid() primary key,
  email text,
  role text,
  code text,
  created_by uuid,
  created_at timestamptz default now(),
  used boolean default false
);
