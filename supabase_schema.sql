-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/hgsxczqrskdvfowqnkdb/sql)

-- Foods table (import from food_data/processed_foods.csv after creating)
create table public.foods (
    id bigint generated always as identity primary key,
    fdc_id text,
    description text not null,
    protein_per_100g numeric,
    fat_per_100g numeric,
    carbs_per_100g numeric,
    calories_per_100g numeric,
    sugar_per_100g numeric,
    fiber_per_100g numeric,
    calcium_per_100g numeric,
    iron_per_100g numeric,
    potassium_per_100g numeric,
    sodium_per_100g numeric,
    vitamin_a_per_100g numeric,
    vitamin_d_per_100g numeric,
    vitamin_c_per_100g numeric,
    cholesterol_per_100g numeric,
    saturated_fat_per_100g numeric,
    serving_size numeric,
    serving_unit text
);

-- Allow anyone to read foods (no login required for search)
alter table public.foods enable row level security;
create policy "Anyone can read foods" on public.foods for select using (true);

-- Food logs table
create table public.food_logs (
    id bigint generated always as identity primary key,
    user_id uuid references auth.users(id) on delete cascade,
    food_id bigint references public.foods(id) on delete cascade,
    grams numeric not null,
    meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snacks')),
    log_date date not null,
    created_at timestamptz default now()
);

-- Users can only see and manage their own logs
alter table public.food_logs enable row level security;
create policy "Users can read own logs" on public.food_logs for select using (auth.uid() = user_id);
create policy "Users can insert own logs" on public.food_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own logs" on public.food_logs for delete using (auth.uid() = user_id);
