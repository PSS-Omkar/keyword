-- Initialize database with sessions table for Replit Auth
-- This will be automatically created by Drizzle, but included for reference

-- Create extension for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE traffid_projects TO traffid_user;