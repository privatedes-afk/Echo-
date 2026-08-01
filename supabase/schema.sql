-- Echo database schema for Supabase (Postgres)

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  subscription_status text default 'free' check (subscription_status in ('free', 'paid')),
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  dream text,
  career_goal text,
  location_goal text,
  fear text,
  regret text,
  relationships text,
  habit text,
  satisfaction_score int check (satisfaction_score between 1 and 10),
  freeform text,
  summary_text text,
  updated_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

create table if not exists public.time_capsules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  message text not null,
  created_at timestamptz default now(),
  unlock_at timestamptz not null,
  delivered boolean default false
);

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.time_capsules enable row level security;

create policy "Users can view own row" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own row" on public.users
  for update using (auth.uid() = id);

create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = user_id);

create policy "Users manage own messages" on public.messages
  for all using (auth.uid() = user_id);

create policy "Users manage own capsules" on public.time_capsules
  for all using (auth.uid() = user_id);
