-- Create role_features table
create table if not exists public.role_features (
  role text not null,
  feature text not null,
  enabled boolean not null default false,
  primary key (role, feature)
);

-- Seed defaults for manager
insert into public.role_features (role, feature, enabled)
values
  ('manager', 'inventory', false)
  ,('manager', 'auctions', false)
  ,('manager', 'admin', false)
  ,('manager', 'settings', false)
on conflict (role, feature) do nothing;
