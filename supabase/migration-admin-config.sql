

CREATE TABLE IF NOT EXISTS admin_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial generation status
INSERT INTO admin_config (key, value) 
VALUES ('generation_status', '{
  "is_generating": false,
  "progress": 0,
  "target": 500,
  "started_at": null,
  "last_run_at": null
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_config_key ON admin_config(key);

-- Add RLS policies (optional - adjust based on your needs)
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Allow service role to read/write
CREATE POLICY "Service role can manage admin config" ON admin_config
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update timestamp automatically
CREATE OR REPLACE FUNCTION update_admin_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_admin_config_timestamp ON admin_config;
CREATE TRIGGER update_admin_config_timestamp
  BEFORE UPDATE ON admin_config
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_config_timestamp();

-- Grant permissions (adjust based on your setup)
GRANT ALL ON admin_config TO postgres;
GRANT ALL ON admin_config TO service_role;

