-- SCOUFF Invites Table & RLS
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text default 'member',
  created_at timestamptz default now(),
  created_by uuid null
);

alter table invites enable row level security;

-- Only admins can insert/select/update/delete
create policy "Admins can manage invites" on invites
  for all
  using (
    exists (
      select 1 from auth.users u
      where u.id = auth.uid()
      and lower(u.email) = any (string_to_array(current_setting('SCOUFF_ADMIN_EMAILS', true), ','))
    )
  );
