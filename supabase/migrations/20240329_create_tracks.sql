create table if not exists public.tracks (
    id bigint primary key,
    name text not null,
    description text,
    longitude text,
    latitude text,
    slug text unique not null,
    status integer default 1,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.user_favorites (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    track_id bigint references public.tracks(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, track_id)
);

create index if not exists tracks_name_idx on public.tracks using gin (to_tsvector('english', name));
create index if not exists tracks_slug_idx on public.tracks (slug);
create index if not exists user_favorites_user_id_idx on public.user_favorites (user_id);
create index if not exists user_favorites_track_id_idx on public.user_favorites (track_id);

-- Drop existing tables if they exist
drop table if exists public.user_favorites;
drop table if exists public.tracks; 