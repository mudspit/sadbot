-- Saved progress for signed-in players. One row per player; only that player can see or change it.
create table public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  unlocked smallint not null default 1 check (unlocked between 1 and 7),
  best jsonb not null default '{}'::jsonb
    check (jsonb_typeof(best) = 'object' and pg_column_size(best) < 2048),
  finished boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

create policy "Players read their own progress" on public.progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Players create their own progress" on public.progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Players update their own progress" on public.progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Signed-out visitors get no access at all; players can't delete rows (deleting the account cascades).
revoke all on table public.progress from anon;
revoke all on table public.progress from authenticated;
grant select, insert, update on table public.progress to authenticated;

create function public.progress_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger progress_touch before update on public.progress
  for each row execute function public.progress_touch();
revoke execute on function public.progress_touch() from public, anon, authenticated;
