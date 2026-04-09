-- Add volunteer_limit column to task table
ALTER TABLE task ADD COLUMN volunteer_limit INT DEFAULT 5;
