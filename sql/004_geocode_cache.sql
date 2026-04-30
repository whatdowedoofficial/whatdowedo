-- Geocode cache table (used by scraper to avoid repeated Nominatim calls)
CREATE TABLE IF NOT EXISTS geocode_cache (
  address_query TEXT PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
