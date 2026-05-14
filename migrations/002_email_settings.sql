ALTER TABLE creators ADD COLUMN email_mode TEXT NOT NULL DEFAULT 'none'
  CHECK(email_mode IN ('none', 'hub', 'resend'));

ALTER TABLE creators ADD COLUMN resend_api_key TEXT;
