-- ===========================================================================
-- NOAFAR — PostgreSQL schema
-- Idempotent: safe to run on every boot.
-- ===========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------- users ----
CREATE TABLE IF NOT EXISTS users (
  id               text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  phone            text NOT NULL UNIQUE,
  display_name     text NOT NULL DEFAULT '',
  national_id      text,
  birth_year       text,
  city             text,
  interests        jsonb NOT NULL DEFAULT '[]'::jsonb,
  role             text NOT NULL DEFAULT 'member'
                     CHECK (role IN ('member', 'operator', 'admin')),
  avatar_url       text,
  bio              text,
  points           integer NOT NULL DEFAULT 0 CHECK (points >= 0),
  profile_complete boolean NOT NULL DEFAULT false,
  is_blocked       boolean NOT NULL DEFAULT false,
  joined_at        timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------- users: email + password sign-in ---
-- Written as separate idempotent statements so an existing deployment picks
-- them up on its next boot without a manual migration.

-- Email-only accounts have no phone number, so the column can no longer be
-- mandatory. A UNIQUE constraint still permits many NULLs in PostgreSQL.
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS email          text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash  text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

-- Case-insensitive uniqueness: Ali@x.com and ali@x.com are the same account.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key
  ON users (lower(email)) WHERE email IS NOT NULL;

-- Every account must remain reachable by at least one identifier.
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_identifier_present
    CHECK (phone IS NOT NULL OR email IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -------------------------------------------------------- password resets ---
CREATE TABLE IF NOT EXISTS password_resets (
  id          bigserial PRIMARY KEY,
  user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  request_ip  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_resets_user_idx ON password_resets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS password_resets_expires_idx ON password_resets (expires_at);

-- ------------------------------------------------------------ otp codes ----
CREATE TABLE IF NOT EXISTS otp_codes (
  id          bigserial PRIMARY KEY,
  phone       text NOT NULL,
  code_hash   text NOT NULL,
  expires_at  timestamptz NOT NULL,
  attempts    integer NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  request_ip  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_codes_phone_created_idx ON otp_codes (phone, created_at DESC);
CREATE INDEX IF NOT EXISTS otp_codes_expires_idx ON otp_codes (expires_at);

-- ------------------------------------------------------------- sessions ----
-- Server-side session records let us revoke a token immediately (logout,
-- role change, block) instead of waiting for the JWT to expire.
CREATE TABLE IF NOT EXISTS sessions (
  id           text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id      text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_agent   text,
  ip           text,
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at);

-- -------------------------------------------------------------- content ----
CREATE TABLE IF NOT EXISTS content (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  section       text NOT NULL
                  CHECK (section IN ('academy','toolbox','library','journey','gathering','spark','blog')),
  slug          text NOT NULL,
  title         text NOT NULL,
  summary       text NOT NULL DEFAULT '',
  body          text NOT NULL DEFAULT '',
  hero_image    jsonb,
  gallery       jsonb NOT NULL DEFAULT '[]'::jsonb,
  attachments   jsonb NOT NULL DEFAULT '[]'::jsonb,
  category      jsonb,
  tags          jsonb NOT NULL DEFAULT '[]'::jsonb,
  author        jsonb,
  data          jsonb NOT NULL DEFAULT '{}'::jsonb,
  status        text NOT NULL DEFAULT 'published'
                  CHECK (status IN ('draft','published','archived')),
  view_count    integer NOT NULL DEFAULT 0,
  like_count    integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  published_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section, slug)
);
CREATE INDEX IF NOT EXISTS content_section_published_idx
  ON content (section, status, published_at DESC);
CREATE INDEX IF NOT EXISTS content_search_idx
  ON content USING gin (to_tsvector('simple', title || ' ' || summary));

-- ---------------------------------------------------- likes / bookmarks ----
CREATE TABLE IF NOT EXISTS likes (
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id text NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, content_id)
);
CREATE INDEX IF NOT EXISTS likes_content_idx ON likes (content_id);

CREATE TABLE IF NOT EXISTS bookmarks (
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id text NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, content_id)
);
CREATE INDEX IF NOT EXISTS bookmarks_user_idx ON bookmarks (user_id, created_at DESC);

-- ------------------------------------------------------------- comments ----
CREATE TABLE IF NOT EXISTS comments (
  id         text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content_id text NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  author_id  text REFERENCES users(id) ON DELETE SET NULL,
  body       text NOT NULL,
  status     text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comments_content_idx ON comments (content_id, created_at DESC);
CREATE INDEX IF NOT EXISTS comments_status_idx ON comments (status, created_at DESC);

-- ---------------------------------------------------------- submissions ----
CREATE TABLE IF NOT EXISTS submissions (
  id                   text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  kind                 text NOT NULL CHECK (kind IN ('idea','experience')),
  title                text NOT NULL,
  summary              text NOT NULL DEFAULT '',
  body                 text NOT NULL DEFAULT '',
  field_slug           text,
  field_name_fa        text,
  region               text,
  organization         text,
  key_impact_metric    text,
  extra                jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags                 jsonb NOT NULL DEFAULT '[]'::jsonb,
  attachments          jsonb NOT NULL DEFAULT '[]'::jsonb,
  submitter_id         text REFERENCES users(id) ON DELETE SET NULL,
  status               text NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','approved','rejected','needs_revision')),
  operator_message     text,
  published_content_id text REFERENCES content(id) ON DELETE SET NULL,
  submitted_at         timestamptz NOT NULL DEFAULT now(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS submissions_submitter_idx ON submissions (submitter_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS submissions_status_idx ON submissions (status, submitted_at DESC);

-- ----------------------------------------------------- contact messages ----
CREATE TABLE IF NOT EXISTS contact_messages (
  id             text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name           text NOT NULL,
  phone_or_email text NOT NULL,
  subject        text NOT NULL DEFAULT '',
  message        text NOT NULL,
  status         text NOT NULL DEFAULT 'unread'
                   CHECK (status IN ('unread','read','replied')),
  admin_notes    text,
  request_ip     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_messages_created_idx ON contact_messages (created_at DESC);

-- -------------------------------------------------- event registrations ----
CREATE TABLE IF NOT EXISTS event_registrations (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id      text NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  user_id       text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_code   text NOT NULL UNIQUE,
  status        text NOT NULL DEFAULT 'confirmed'
                  CHECK (status IN ('confirmed','cancelled')),
  registered_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS event_registrations_unique_active
  ON event_registrations (event_id, user_id) WHERE status = 'confirmed';

-- -------------------------------------------------------- saved canvases ---
CREATE TABLE IF NOT EXISTS saved_canvases (
  id         text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id    text REFERENCES content(id) ON DELETE SET NULL,
  tool_slug  text,
  tool_title text NOT NULL DEFAULT '',
  title      text NOT NULL DEFAULT '',
  notes      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS saved_canvases_user_idx ON saved_canvases (user_id, updated_at DESC);

-- ---------------------------------------------------- point transactions ---
CREATE TABLE IF NOT EXISTS point_transactions (
  id         text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason     text NOT NULL,
  reason_fa  text NOT NULL DEFAULT '',
  points     integer NOT NULL,
  /**
   * Idempotency guard: one award per (user, reason, subject). Lets us award
   * "first canvas" or "course completed" exactly once without racing.
   */
  dedupe_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS point_transactions_user_idx ON point_transactions (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS point_transactions_dedupe_idx
  ON point_transactions (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;

-- -------------------------------------------------------- course progress --
CREATE TABLE IF NOT EXISTS course_progress (
  user_id          text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id        text NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  percent          integer NOT NULL DEFAULT 0 CHECK (percent BETWEEN 0 AND 100),
  position_seconds integer NOT NULL DEFAULT 0,
  completed_lessons jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_at     timestamptz,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);

-- --------------------------------------------------------- site settings ---
CREATE TABLE IF NOT EXISTS site_settings (
  id         integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------- rate limits ----
-- Persisted counters so limits survive restarts and work with >1 instance.
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket      text PRIMARY KEY,
  hits        integer NOT NULL DEFAULT 0,
  window_ends timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON rate_limits (window_ends);
