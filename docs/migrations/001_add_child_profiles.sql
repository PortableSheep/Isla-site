-- Migration: Add child profile fields to users table
-- Description: Add support for child profiles with status tracking and parent relationships
-- Created: 2024

-- Add columns to users table if they don't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'active' NOT NULL,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS age integer CHECK (age >= 0 AND age <= 18),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES users(id) ON DELETE SET NULL;

-- Create index for parent-child relationships
CREATE INDEX IF NOT EXISTS idx_users_parent_id_status ON users(parent_id, status);

-- Create index for efficient status queries
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Add constraint to ensure age is valid if provided
ALTER TABLE users
ADD CONSTRAINT valid_age CHECK (age IS NULL OR (age >= 0 AND age <= 18));
