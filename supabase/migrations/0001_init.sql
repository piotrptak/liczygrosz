-- LiczyGrosz schema. Run once in Supabase: SQL Editor → New query → paste → Run.
-- Every table is private to its owner through Row Level Security.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  type text not null check (type in ('income', 'expense')),
  icon text,
  color text,
  created_at timestamptz not null default now(),
  -- Transactions reference categories by name, so names are unique per user.
  unique (user_id, name)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category text not null,
  date timestamptz not null,
  note text not null default '' check (char_length(note) <= 200),
  currency text not null check (currency in ('PLN', 'EUR', 'USD')),
  recurring_id uuid,
  created_at timestamptz not null default now()
);
create index transactions_user_date_idx on public.transactions (user_id, date desc);

create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category text not null,
  frequency text not null check (frequency in ('weekly', 'monthly')),
  -- Anchor of the schedule; monthly occurrences are start_date + n months, so the 31st stays month-end.
  start_date date not null,
  next_due_date date not null,
  note text not null default '' check (char_length(note) <= 200),
  currency text not null check (currency in ('PLN', 'EUR', 'USD')),
  created_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  locale text check (locale in ('pl', 'en')),
  currency text check (currency in ('PLN', 'EUR', 'USD')),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.user_settings enable row level security;

create policy "own rows" on public.categories for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.transactions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.recurring_transactions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.user_settings for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Live updates between devices (phone ↔ web).
alter publication supabase_realtime add table public.categories, public.transactions,
  public.recurring_transactions, public.user_settings;

-- Books every due occurrence of the caller's recurring items, catching up on missed periods.
-- Row locks make it safe when several devices call it at the same time.
-- p_today is the caller's local date, so "due" follows the user's time zone.
create or replace function public.process_recurring(p_today date)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  item public.recurring_transactions%rowtype;
  due date;
  booked integer := 0;
begin
  for item in
    select * from public.recurring_transactions
    where user_id = auth.uid() and next_due_date <= p_today
    for update
  loop
    due := item.next_due_date;
    while due <= p_today loop
      insert into public.transactions (user_id, amount, type, category, date, note, currency, recurring_id)
      values (item.user_id, item.amount, item.type, item.category, due::timestamptz + interval '12 hours',
              item.note, item.currency, item.id);
      booked := booked + 1;
      if item.frequency = 'weekly' then
        due := due + 7;
      else
        due := (item.start_date + make_interval(months =>
          ((extract(year from due) - extract(year from item.start_date)) * 12
            + extract(month from due) - extract(month from item.start_date))::int + 1))::date;
      end if;
    end loop;
    update public.recurring_transactions set next_due_date = due where id = item.id;
  end loop;
  return booked;
end;
$$;

-- Lets a signed-in user delete their account; all data goes with it (on delete cascade).
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
revoke execute on function public.process_recurring(date) from public, anon;
grant execute on function public.process_recurring(date) to authenticated;

-- Delete events over Realtime carry the old primary key only with replica identity full.
alter table public.categories replica identity full;
alter table public.transactions replica identity full;
alter table public.recurring_transactions replica identity full;
