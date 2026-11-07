-- Stage 8 (The Quiet Signal) was added: allow more unlocked stages, with headroom for future ones.
-- After applying, raise DB_MAX_UNLOCKED in js/account.js to match.
alter table public.progress drop constraint progress_unlocked_check;
alter table public.progress add constraint progress_unlocked_check check (unlocked between 1 and 12);
