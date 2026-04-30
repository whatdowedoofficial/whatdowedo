-- Enable PostGIS extension (run once on Supabase SQL Editor)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN (
    'musica', 'cinema', 'cultura', 'mercato', 'sport',
    'nightlife', 'food', 'teatro', 'altro'
  )),
  venue_name TEXT,
  address TEXT,
  location GEOGRAPHY(POINT, 4326),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  price_info TEXT,
  source_url TEXT,
  source_name TEXT,
  image_url TEXT,
  external_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Spatial index for geo queries
CREATE INDEX IF NOT EXISTS idx_events_location ON events USING GIST (location);

-- Filter future events efficiently
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events (start_time);

-- Category filter
CREATE INDEX IF NOT EXISTS idx_events_category ON events (category);

-- Deduplication lookups
CREATE INDEX IF NOT EXISTS idx_events_external_id ON events (external_id);
