-- Wishlist rows, one per saved product. Run once in the Supabase SQL editor.
create table if not exists public.wishlist (
  user_id    uuid        not null references auth.users on delete cascade,
  product_id text        not null,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.wishlist enable row level security;

-- One policy, all four verbs: you may only ever touch your own rows. The anon
-- key is public by design, so this is the only thing standing between a
-- stranger and someone else's wishlist — it is not optional.
drop policy if exists "own rows only" on public.wishlist;
create policy "own rows only" on public.wishlist
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
