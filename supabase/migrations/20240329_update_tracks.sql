-- Drop existing tables
DROP TABLE IF EXISTS public.lap_sessions CASCADE;
DROP TABLE IF EXISTS public.user_favorites CASCADE;
DROP TABLE IF EXISTS public.tracks CASCADE;

-- Create tracks table with new structure
CREATE TABLE public.tracks (
    id bigint PRIMARY KEY,
    name text NOT NULL,
    description text,
    longitude text,
    latitude text,
    slug text UNIQUE NOT NULL,
    status integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_favorites table
CREATE TABLE public.user_favorites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    track_id bigint REFERENCES public.tracks(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, track_id)
);

-- Create lap_sessions table with updated reference
CREATE TABLE public.lap_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    track_id bigint REFERENCES public.tracks(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    total_time bigint NOT NULL,
    laps jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX tracks_name_idx ON public.tracks using gin (to_tsvector('english', name));
CREATE INDEX tracks_slug_idx ON public.tracks(slug);
CREATE INDEX user_favorites_user_id_idx ON public.user_favorites(user_id);
CREATE INDEX user_favorites_track_id_idx ON public.user_favorites(track_id);
CREATE INDEX lap_sessions_user_id_idx ON lap_sessions(user_id);
CREATE INDEX lap_sessions_track_id_idx ON lap_sessions(track_id);
CREATE INDEX lap_sessions_date_idx ON lap_sessions(date);
CREATE INDEX lap_sessions_created_at_idx ON lap_sessions(created_at);

-- Enable RLS
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lap_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view tracks"
  ON public.tracks FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own favorites"
  ON public.user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON public.user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.user_favorites FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own lap sessions"
  ON public.lap_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lap sessions"
  ON public.lap_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lap sessions"
  ON public.lap_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lap sessions"
  ON public.lap_sessions FOR DELETE
  USING (auth.uid() = user_id); 