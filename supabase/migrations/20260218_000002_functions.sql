-- Create helper functions is_ceo, is_manager, has_feature
create or replace function public.is_ceo() returns boolean language sql security definer as $$
  select (current_setting('jwt.claims.role', true) = 'CEO') or (current_setting('jwt.claims.role', true) = 'ceo');
$$;

create or replace function public.is_manager() returns boolean language sql security definer as $$
  select (current_setting('jwt.claims.role', true) = 'MANAGER') or (current_setting('jwt.claims.role', true) = 'manager');
$$;

create or replace function public.has_feature(feature_name text) returns boolean language sql security definer as $$
  select exists(
    select 1 from public.role_features rf
    where rf.role = lower(current_setting('jwt.claims.role', true))
      and rf.feature = feature_name
      and rf.enabled = true
  );
$$;

grant execute on function public.is_ceo() to authenticated;
grant execute on function public.is_manager() to authenticated;
grant execute on function public.has_feature(text) to authenticated;
