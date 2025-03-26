-- Create tables for the MX Hub application

-- Notes table
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Suspension settings table
CREATE TABLE suspension_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fork_compression INTEGER NOT NULL,
  fork_rebound INTEGER NOT NULL,
  shock_high_speed_compression INTEGER NOT NULL,
  shock_low_speed_compression INTEGER NOT NULL,
  shock_rebound INTEGER NOT NULL,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Drop old tables
DROP TABLE IF EXISTS lap_times CASCADE;

-- Create tracks table
CREATE TABLE public.tracks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, name)
);

-- Create lap_sessions table
CREATE TABLE public.lap_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    track_id uuid REFERENCES public.tracks(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    total_time bigint NOT NULL,
    laps jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create new workouts table
CREATE TABLE workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create exercises table
CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('cardio', 'strength')),
  name TEXT NOT NULL,
  reps INTEGER,
  weight NUMERIC,
  duration INTEGER,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create riding_checklists table
CREATE TABLE IF NOT EXISTS public.riding_checklists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    chain_tension boolean DEFAULT false,
    chain_lube boolean DEFAULT false,
    tire_type boolean DEFAULT false,
    tire_pressure boolean DEFAULT false,
    riding_gear boolean DEFAULT false,
    tools boolean DEFAULT false,
    food boolean DEFAULT false,
    water boolean DEFAULT false,
    fluids boolean DEFAULT false,
    fork_pressure boolean DEFAULT false,
    axle_nuts boolean DEFAULT false,
    linkage_nuts boolean DEFAULT false,
    sprocket_bolts boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Create moto_checklists table
CREATE TABLE IF NOT EXISTS public.moto_checklists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    riding_checklist_id uuid REFERENCES public.riding_checklists(id) ON DELETE CASCADE NOT NULL,
    moto_number integer NOT NULL,
    fluids boolean DEFAULT false,
    fork_pressure boolean DEFAULT false,
    chain_lube boolean DEFAULT false,
    chain_tension boolean DEFAULT false,
    axle_nuts boolean DEFAULT false,
    linkage_nuts boolean DEFAULT false,
    sprocket_bolts boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(riding_checklist_id, moto_number)
);

-- Create indexes for user_id columns
CREATE INDEX notes_user_id_idx ON notes(user_id);
CREATE INDEX suspension_settings_user_id_idx ON suspension_settings(user_id);
CREATE INDEX workouts_user_id_idx ON workouts(user_id);
CREATE INDEX tracks_user_id_idx ON tracks(user_id);

-- Create indexes for better query performance
CREATE INDEX notes_created_at_idx ON notes(created_at);
CREATE INDEX suspension_settings_created_at_idx ON suspension_settings(created_at);
CREATE INDEX workouts_date_idx ON workouts(date);
CREATE INDEX tracks_name_idx ON tracks(name);
CREATE INDEX exercises_workout_id_idx ON exercises(workout_id);
CREATE INDEX exercises_user_id_idx ON exercises(user_id);

-- Create indexes for lap_sessions
CREATE INDEX lap_sessions_user_id_idx ON lap_sessions(user_id);
CREATE INDEX lap_sessions_track_id_idx ON lap_sessions(track_id);
CREATE INDEX lap_sessions_date_idx ON lap_sessions(date);
CREATE INDEX lap_sessions_created_at_idx ON lap_sessions(created_at);
CREATE INDEX lap_sessions_user_track_idx ON lap_sessions(user_id, track_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS riding_checklists_user_id_idx ON public.riding_checklists(user_id);
CREATE INDEX IF NOT EXISTS riding_checklists_date_idx ON public.riding_checklists(date);
CREATE INDEX IF NOT EXISTS moto_checklists_user_id_idx ON public.moto_checklists(user_id);
CREATE INDEX IF NOT EXISTS moto_checklists_riding_checklist_id_idx ON public.moto_checklists(riding_checklist_id);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspension_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE lap_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riding_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moto_checklists ENABLE ROW LEVEL SECURITY;

-- Create policies for notes
CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for suspension settings
CREATE POLICY "Users can view their own suspension settings"
  ON suspension_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own suspension settings"
  ON suspension_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suspension settings"
  ON suspension_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suspension settings"
  ON suspension_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for workouts
CREATE POLICY "Users can view their own workouts"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts"
  ON workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
  ON workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
  ON workouts FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for exercises
CREATE POLICY "Users can view their own exercises"
  ON exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercises"
  ON exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercises"
  ON exercises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercises"
  ON exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for tracks
CREATE POLICY "Users can view their own tracks"
  ON public.tracks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracks"
  ON public.tracks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks"
  ON public.tracks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracks"
  ON public.tracks FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for lap sessions
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

-- Create policies for riding checklists
CREATE POLICY "Users can view their own riding checklists"
    ON public.riding_checklists
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own riding checklists"
    ON public.riding_checklists
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own riding checklists"
    ON public.riding_checklists
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own riding checklists"
    ON public.riding_checklists
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for moto checklists
CREATE POLICY "Users can view their own moto checklists"
    ON public.moto_checklists
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own moto checklists"
    ON public.moto_checklists
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own moto checklists"
    ON public.moto_checklists
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own moto checklists"
    ON public.moto_checklists
    FOR DELETE
    USING (auth.uid() = user_id); 