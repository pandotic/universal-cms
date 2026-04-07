-- Career Hub: core schema for ESG careers & training
-- Adapted from esg_source_career_hub_package/sql/esg-career-hub-schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
DO $$ BEGIN CREATE TYPE program_type AS ENUM ('certification','certificate_program','course','webinar','learning_library','knowledge_hub','exam_prep','jobs_resource'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE program_level AS ENUM ('beginner','intermediate','advanced','mixed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE program_format AS ENUM ('self_paced','live_online','partner_led','hybrid','resource_library','webinar'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE resource_type AS ENUM ('youtube_video','youtube_playlist','webinar','downloadable_resource','standards_hub','official_page','channel'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE user_program_status AS ENUM ('saved','planned','in_progress','completed','expired','paused','abandoned'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE experience_level AS ENUM ('student','early_career','mid_career','senior','executive','career_switcher'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE budget_preference AS ENUM ('free_only','low','moderate','high','employer_paid'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Catalog tables

CREATE TABLE IF NOT EXISTS ch_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_description TEXT,
  long_description TEXT,
  official_url TEXT NOT NULL,
  official_youtube_channel_url TEXT,
  logo_url TEXT,
  organization_type TEXT,
  headquarters_region TEXT,
  provider_category TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ch_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_description TEXT,
  full_description TEXT,
  department_context TEXT,
  core_skills JSONB DEFAULT '[]'::jsonb,
  common_frameworks JSONB DEFAULT '[]'::jsonb,
  typical_titles JSONB DEFAULT '[]'::jsonb,
  beginner_path_summary TEXT,
  intermediate_path_summary TEXT,
  advanced_path_summary TEXT,
  progression_stage TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ch_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ch_job_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_external BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ch_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES ch_providers(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  program_type program_type NOT NULL,
  short_summary TEXT,
  full_description TEXT,
  official_url TEXT NOT NULL,
  program_status TEXT DEFAULT 'active',
  is_free BOOLEAN DEFAULT FALSE,
  price_text TEXT,
  price_min NUMERIC(10,2),
  price_max NUMERIC(10,2),
  currency TEXT,
  duration_text TEXT,
  estimated_hours INTEGER,
  level program_level DEFAULT 'mixed',
  format program_format DEFAULT 'self_paced',
  exam_required BOOLEAN DEFAULT FALSE,
  certificate_of_completion BOOLEAN DEFAULT FALSE,
  credential_awarded BOOLEAN DEFAULT FALSE,
  credential_name TEXT,
  renewal_required BOOLEAN DEFAULT FALSE,
  renewal_text TEXT,
  continuing_education_text TEXT,
  prerequisite_text TEXT,
  official_video_embed_url TEXT,
  official_video_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  featured_rank INTEGER DEFAULT 0,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ch_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES ch_providers(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  resource_type resource_type NOT NULL,
  official_url TEXT NOT NULL,
  embed_url TEXT,
  short_summary TEXT,
  thumbnail_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Junction / mapping tables

CREATE TABLE IF NOT EXISTS ch_program_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES ch_programs(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES ch_roles(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  recommendation_rank INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (program_id, role_id)
);

CREATE TABLE IF NOT EXISTS ch_program_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES ch_programs(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES ch_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (program_id, tag_id)
);

CREATE TABLE IF NOT EXISTS ch_role_recommended_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES ch_roles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES ch_programs(id) ON DELETE CASCADE,
  recommendation_type TEXT,
  progression_stage TEXT,
  is_free_priority BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (role_id, program_id, recommendation_type, progression_stage)
);

CREATE TABLE IF NOT EXISTS ch_role_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES ch_roles(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES ch_resources(id) ON DELETE CASCADE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (role_id, resource_id)
);

CREATE TABLE IF NOT EXISTS ch_role_progression_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_role_id UUID NOT NULL REFERENCES ch_roles(id) ON DELETE CASCADE,
  to_role_id UUID NOT NULL REFERENCES ch_roles(id) ON DELETE CASCADE,
  transition_summary TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (from_role_id, to_role_id)
);

-- User tables (user_id is TEXT for now since auth is localStorage-based;
-- migrate to UUID FK on auth.users when real auth is wired up)

CREATE TABLE IF NOT EXISTS ch_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  current_role_id UUID REFERENCES ch_roles(id) ON DELETE SET NULL,
  target_role_id UUID REFERENCES ch_roles(id) ON DELETE SET NULL,
  experience_level experience_level,
  region TEXT,
  budget_preference budget_preference DEFAULT 'moderate',
  free_only_preference BOOLEAN DEFAULT FALSE,
  preferred_learning_format program_format,
  career_goal_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ch_user_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  program_id UUID NOT NULL REFERENCES ch_programs(id) ON DELETE CASCADE,
  status user_program_status DEFAULT 'saved',
  date_started DATE,
  target_completion_date DATE,
  completion_date DATE,
  exam_date DATE,
  renewal_date DATE,
  notes TEXT,
  uploaded_proof_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, program_id)
);

CREATE TABLE IF NOT EXISTS ch_user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  program_id UUID REFERENCES ch_programs(id) ON DELETE SET NULL,
  credential_name TEXT NOT NULL,
  credential_number TEXT,
  issue_date DATE,
  expiration_date DATE,
  renewal_required BOOLEAN DEFAULT FALSE,
  proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ch_user_saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  job_source_id UUID REFERENCES ch_job_sources(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  company TEXT,
  url TEXT,
  notes TEXT,
  saved_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, url)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ch_programs_provider ON ch_programs(provider_id);
CREATE INDEX IF NOT EXISTS idx_ch_programs_type ON ch_programs(program_type);
CREATE INDEX IF NOT EXISTS idx_ch_programs_free ON ch_programs(is_free) WHERE is_free = TRUE;
CREATE INDEX IF NOT EXISTS idx_ch_programs_featured ON ch_programs(is_featured, featured_rank) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_ch_resources_provider ON ch_resources(provider_id);
CREATE INDEX IF NOT EXISTS idx_ch_user_programs_user ON ch_user_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_ch_user_credentials_user ON ch_user_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_ch_user_saved_jobs_user ON ch_user_saved_jobs(user_id);
