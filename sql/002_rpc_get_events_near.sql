-- RPC function: get events within radius of a point
-- Called from the mobile app via supabase.rpc('get_events_near', {...})
CREATE OR REPLACE FUNCTION get_events_near(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 10,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  venue_name TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  price_info TEXT,
  source_url TEXT,
  source_name TEXT,
  image_url TEXT,
  distance_km DOUBLE PRECISION
)
LANGUAGE sql STABLE
AS $$
  SELECT
    e.id,
    e.title,
    e.description,
    e.category,
    e.venue_name,
    e.address,
    ST_Y(e.location::geometry) AS lat,
    ST_X(e.location::geometry) AS lng,
    e.start_time,
    e.end_time,
    e.price_info,
    e.source_url,
    e.source_name,
    e.image_url,
    ROUND((ST_Distance(
      e.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1000)::numeric, 2)::double precision AS distance_km
  FROM events e
  WHERE
    ST_DWithin(
      e.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_km * 1000
    )
    AND e.start_time >= NOW()
    AND (category_filter IS NULL OR e.category = category_filter)
  ORDER BY e.start_time ASC;
$$;
