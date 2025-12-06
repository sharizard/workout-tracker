-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create a table for workout plans
create table plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null, -- e.g., "My 3-Day Split"
  days_per_week int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table plans enable row level security;

create policy "Users can view own plans." on plans
  for select using (auth.uid() = user_id);

create policy "Users can insert own plans." on plans
  for insert with check (auth.uid() = user_id);

create policy "Users can update own plans." on plans
  for update using (auth.uid() = user_id);

-- Create a table for plan days
create table plan_days (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references plans on delete cascade not null,
  day_order int not null, -- 1, 2, 3...
  headline text not null, -- e.g., "Chest & Triceps"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table plan_days enable row level security;

create policy "Users can view own plan days." on plan_days
  for select using (
    exists ( select 1 from plans where plans.id = plan_days.plan_id and plans.user_id = auth.uid() )
  );

create policy "Users can insert own plan days." on plan_days
  for insert with check (
    exists ( select 1 from plans where plans.id = plan_days.plan_id and plans.user_id = auth.uid() )
  );

-- Create a table for exercises
create table exercises (
  id uuid default gen_random_uuid() primary key,
  day_id uuid references plan_days on delete cascade not null,
  name text not null,
  sets int,
  reps text, -- "8-12"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table exercises enable row level security;

create policy "Users can view own exercises." on exercises
  for select using (
    exists (
      select 1 from plan_days
      join plans on plans.id = plan_days.plan_id
      where plan_days.id = exercises.day_id and plans.user_id = auth.uid()
    )
  );

create policy "Users can insert own exercises." on exercises
  for insert with check (
    exists (
      select 1 from plan_days
      join plans on plans.id = plan_days.plan_id
      where plan_days.id = exercises.day_id and plans.user_id = auth.uid()
    )
  );

-- Create a table for weeks
create table weeks (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references plans on delete cascade not null,
  start_date date not null,
  is_locked boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table weeks enable row level security;

create policy "Users can view own weeks." on weeks
  for select using (
    exists ( select 1 from plans where plans.id = weeks.plan_id and plans.user_id = auth.uid() )
  );

create policy "Users can insert own weeks." on weeks
  for insert with check (
    exists ( select 1 from plans where plans.id = weeks.plan_id and plans.user_id = auth.uid() )
  );

create policy "Users can update own weeks." on weeks
  for update using (
    exists ( select 1 from plans where plans.id = weeks.plan_id and plans.user_id = auth.uid() )
  );

-- Create a table for logs (actual lifts)
create table logs (
  id uuid default gen_random_uuid() primary key,
  week_id uuid references weeks on delete cascade not null,
  exercise_id uuid references exercises on delete cascade not null,
  day_number int not null, -- 1, 2, 3... (corresponding to plan_days.day_order)
  weight_lifted text, -- e.g., "100kg"
  sets int,
  reps text,
  notes text,
  difficulty text, -- "Easy", "Medium", "Difficult"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(week_id, exercise_id, day_number)
);

alter table logs enable row level security;

create policy "Users can view own logs." on logs
  for select using (
    exists (
      select 1 from weeks
      join plans on plans.id = weeks.plan_id
      where weeks.id = logs.week_id and plans.user_id = auth.uid()
    )
  );

create policy "Users can insert own logs." on logs
  for insert with check (
    exists (
      select 1 from weeks
      join plans on plans.id = weeks.plan_id
      where weeks.id = logs.week_id and plans.user_id = auth.uid()
    )
  );

create policy "Users can update own logs." on logs
  for update using (
    exists (
      select 1 from weeks
      join plans on plans.id = weeks.plan_id
      where weeks.id = logs.week_id and plans.user_id = auth.uid()
    )
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- MIGRATION: Run this if you already have the table
-- MIGRATION: Run this if you already have the table
-- alter table logs add column difficulty text;
-- alter table logs add column sets int;
-- alter table logs add column reps text;
