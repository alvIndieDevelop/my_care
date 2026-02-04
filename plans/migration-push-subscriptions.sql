-- Create push_subscriptions table
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  -- Ensure one subscription per endpoint
  unique(endpoint)
);

-- Index for faster lookups
create index if not exists push_subscriptions_user_id_idx on push_subscriptions(user_id);

-- Enable RLS
alter table push_subscriptions enable row level security;

-- RLS Policies
create policy "Users can insert own subscriptions"
  on push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can view own subscriptions"
  on push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can delete own subscriptions"
  on push_subscriptions for delete
  using (auth.uid() = user_id);

-- Admins can view all subscriptions (for sending notifications)
create policy "Admins can view all subscriptions"
  on push_subscriptions for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Grant permissions
grant all on push_subscriptions to authenticated;
