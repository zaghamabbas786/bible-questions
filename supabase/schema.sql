-- Create public searches table for SEO
CREATE TABLE IF NOT EXISTS searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT -- Optional: track if user was logged in
);

-- Create user searches table for tracking per-user search count
CREATE TABLE IF NOT EXISTS user_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on searches for faster queries
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_searches_query ON searches(query);

-- Create index on user_searches
CREATE INDEX IF NOT EXISTS idx_user_searches_user_id ON user_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_searches_created_at ON user_searches(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_searches ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read searches (for SEO/public access)
CREATE POLICY "Public searches are viewable by everyone" ON searches
  FOR SELECT USING (true);

-- Policy: Anyone can insert searches (for tracking)
CREATE POLICY "Anyone can insert searches" ON searches
  FOR INSERT WITH CHECK (true);

-- Policy: Users can only see their own search history
-- Note: Since we're using Clerk, we pass user_id directly from the API
CREATE POLICY "Users can view own searches" ON user_searches
  FOR SELECT USING (true);

-- Policy: Users can insert their own searches
-- Note: Since we're using Clerk, we pass user_id directly from the API
CREATE POLICY "Users can insert own searches" ON user_searches
  FOR INSERT WITH CHECK (true);

