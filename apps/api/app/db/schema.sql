create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  first_name text,
  last_name text,
  role text not null default 'guest'
);

create table if not exists invite_tokens (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references guests(id),
  token text not null,
  code text not null,
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references guests(id),
  status text default 'pending'
);