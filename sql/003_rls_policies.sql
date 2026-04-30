-- Enable Row Level Security on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon key) to read events
CREATE POLICY "Anyone can read events"
  ON events
  FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE from client — only service role (scraper) can write
-- The service_role key bypasses RLS, so no explicit write policy is needed.
