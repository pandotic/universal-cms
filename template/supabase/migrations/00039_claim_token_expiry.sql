-- Add token expiry column to claim requests for email verification flow.
ALTER TABLE company_claim_requests
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
