-- Add columns for ETH destinations
ALTER TABLE goals
ADD COLUMN success_destination TEXT DEFAULT 'creator',
ADD COLUMN failure_destination TEXT DEFAULT 'referee';

-- Add column for charity/organization address if applicable
ALTER TABLE goals
ADD COLUMN charity_address TEXT;
