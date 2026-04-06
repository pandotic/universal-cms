-- ============================================================================
-- 00022_forms_and_leads.sql
-- Forms, form submissions, and CTA blocks for lead capture
-- ============================================================================

-- ---------- Enums ----------
CREATE TYPE form_type AS ENUM ('contact', 'lead', 'newsletter', 'cta', 'custom');
CREATE TYPE form_field_type AS ENUM (
  'text', 'email', 'textarea', 'select', 'checkbox', 'radio', 'number', 'tel', 'url', 'hidden'
);
CREATE TYPE form_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE submission_status AS ENUM ('new', 'read', 'archived', 'spam');
CREATE TYPE cta_block_status AS ENUM ('draft', 'active', 'archived');

-- ---------- Forms ----------
CREATE TABLE forms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  form_type       form_type NOT NULL DEFAULT 'custom',
  description     TEXT,
  fields          JSONB NOT NULL DEFAULT '[]',
  -- fields is an array of: { name, label, type (form_field_type), placeholder, required, options[] }
  settings        JSONB NOT NULL DEFAULT '{}',
  -- settings: { submitLabel, successMessage, redirectUrl, webhookUrl, notifyEmails[], honeypotField }
  status          form_status NOT NULL DEFAULT 'draft',
  submission_count INT NOT NULL DEFAULT 0,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_forms_slug ON forms(slug);
CREATE INDEX idx_forms_status ON forms(status);

-- ---------- Form Submissions ----------
CREATE TABLE form_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id         UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  data            JSONB NOT NULL DEFAULT '{}',
  status          submission_status NOT NULL DEFAULT 'new',
  source_url      TEXT,
  ip_hash         TEXT,
  user_agent      TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_submitted ON form_submissions(submitted_at DESC);

-- ---------- CTA Blocks ----------
CREATE TABLE cta_blocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  placement       TEXT NOT NULL DEFAULT 'homepage',
  -- placement: homepage, sidebar, footer, post-content, inline, popup, banner
  heading         TEXT NOT NULL,
  subheading      TEXT,
  primary_button_text   TEXT,
  primary_button_url    TEXT,
  secondary_button_text TEXT,
  secondary_button_url  TEXT,
  background_style      TEXT NOT NULL DEFAULT 'light',
  -- background_style: light, dark, gradient, image
  background_image_url  TEXT,
  form_id               UUID REFERENCES forms(id) ON DELETE SET NULL,
  -- If set, renders the form inline instead of buttons
  status          cta_block_status NOT NULL DEFAULT 'draft',
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cta_blocks_slug ON cta_blocks(slug);
CREATE INDEX idx_cta_blocks_placement ON cta_blocks(placement);
CREATE INDEX idx_cta_blocks_status ON cta_blocks(status);

-- ---------- Trigger: auto-update updated_at ----------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_forms_updated_at') THEN
    CREATE TRIGGER trg_forms_updated_at
      BEFORE UPDATE ON forms
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cta_blocks_updated_at') THEN
    CREATE TRIGGER trg_cta_blocks_updated_at
      BEFORE UPDATE ON cta_blocks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ---------- Trigger: increment submission count ----------
CREATE OR REPLACE FUNCTION increment_form_submission_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE forms SET submission_count = submission_count + 1 WHERE id = NEW.form_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_form_submission_count
  AFTER INSERT ON form_submissions
  FOR EACH ROW EXECUTE FUNCTION increment_form_submission_count();

-- ---------- RLS ----------
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cta_blocks ENABLE ROW LEVEL SECURITY;

-- Forms: admins can CRUD, public can read active forms
CREATE POLICY forms_public_read ON forms
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE POLICY forms_admin_all ON forms
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Form submissions: public can insert, admins can read/manage
CREATE POLICY submissions_public_insert ON form_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY submissions_admin_all ON form_submissions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- CTA blocks: admins can CRUD, public can read active blocks
CREATE POLICY cta_blocks_public_read ON cta_blocks
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE POLICY cta_blocks_admin_all ON cta_blocks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ---------- Seed default CTA blocks from existing hardcoded CTASection ----------
INSERT INTO cta_blocks (name, slug, placement, heading, subheading, primary_button_text, primary_button_url, secondary_button_text, secondary_button_url, background_style, background_image_url, status, sort_order) VALUES
(
  'ESG Score Assessment',
  'esg-score-cta',
  'homepage',
  'Get Your Free ESG Score',
  'Answer 30 questions across Environmental, Social, and Governance categories to get your organization''s ESG score with personalized recommendations. Takes about 10 minutes.',
  'Start the Assessment',
  '/score',
  'ESG for Small Business',
  '/small-business',
  'gradient',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80',
  'active',
  1
),
(
  'Find Your Solution',
  'find-solution-cta',
  'homepage',
  'Not sure where to start? Let us help.',
  'Answer 5 quick questions and get personalized recommendations for ESG software, consulting partners, and frameworks that match your needs.',
  'Find Your ESG Solution',
  '/find',
  'Browse the Glossary',
  '/glossary',
  'dark',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80',
  'active',
  2
);
