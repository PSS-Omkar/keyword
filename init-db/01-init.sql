-- PostgreSQL initialization script
-- This script sets up the initial database structure

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create a dedicated schema for the application (optional)
-- CREATE SCHEMA IF NOT EXISTS keyword_generator;

-- The actual tables will be created by Drizzle migrations
-- This script is mainly for any initial setup that needs to happen before the app starts
