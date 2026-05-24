-- Add signup_pending flag to track companies awaiting Stripe payment confirmation.
-- Using a boolean column avoids modifying existing CHECK constraints.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS signup_pending boolean NOT NULL DEFAULT false;
