-- Reviews: user-submitted reviews with moderation and voting

-- =============================================================================
-- Enums
-- =============================================================================
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');

-- =============================================================================
-- cms_reviews
-- =============================================================================
CREATE TABLE cms_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  display_name  TEXT,
  rating        NUMERIC(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title         TEXT,
  body          TEXT,
  status        review_status NOT NULL DEFAULT 'pending',
  multi_ratings JSONB NOT NULL DEFAULT '{}',
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_cms_reviews_updated_at
  BEFORE UPDATE ON cms_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- review_votes
-- =============================================================================
CREATE TABLE review_votes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES cms_reviews(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'unhelpful')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (review_id, user_id)
);

-- =============================================================================
-- reviews_public view
-- =============================================================================
CREATE VIEW reviews_public AS
  SELECT
    id,
    entity_type,
    entity_id,
    display_name,
    rating,
    title,
    body,
    multi_ratings,
    helpful_count,
    created_at
  FROM cms_reviews
  WHERE status = 'approved';

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX idx_cms_reviews_entity ON cms_reviews (entity_type, entity_id);
CREATE INDEX idx_cms_reviews_status ON cms_reviews (status);
CREATE INDEX idx_cms_reviews_user_id ON cms_reviews (user_id);
CREATE INDEX idx_review_votes_review_id ON review_votes (review_id);

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE cms_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- Approved reviews are readable by everyone (via direct table access too)
CREATE POLICY cms_reviews_select_approved
  ON cms_reviews FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- Editors/admins can read all reviews (including pending, rejected, flagged)
CREATE POLICY cms_reviews_select_editorial
  ON cms_reviews FOR SELECT
  TO authenticated
  USING (has_role('editor') OR has_role('admin'));

-- Authenticated users can submit reviews
CREATE POLICY cms_reviews_insert_authenticated
  ON cms_reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Editors/admins can update reviews (moderation)
CREATE POLICY cms_reviews_update_editorial
  ON cms_reviews FOR UPDATE
  TO authenticated
  USING (has_role('editor') OR has_role('admin'))
  WITH CHECK (has_role('editor') OR has_role('admin'));

-- Editors/admins can delete reviews
CREATE POLICY cms_reviews_delete_editorial
  ON cms_reviews FOR DELETE
  TO authenticated
  USING (has_role('editor') OR has_role('admin'));

-- Votes: readable by all
CREATE POLICY review_votes_select_public
  ON review_votes FOR SELECT
  TO anon, authenticated
  USING (true);

-- Votes: authenticated users can insert
CREATE POLICY review_votes_insert_authenticated
  ON review_votes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Votes: users can delete their own votes
CREATE POLICY review_votes_delete_own
  ON review_votes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
