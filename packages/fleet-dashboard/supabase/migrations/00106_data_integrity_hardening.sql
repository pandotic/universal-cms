-- ─── Data Integrity Hardening ─────────────────────────────────────────────
-- Added: QA phase - enforce consistency between agent and agent_runs

-- Add CHECK constraint to ensure agent_runs.property_id matches agent.property_id
ALTER TABLE hub_agent_runs
ADD CONSTRAINT agent_run_property_consistency CHECK (
  -- This will be enforced by a trigger since CHECK constraints can't join tables
  true
);

-- Create trigger to validate property_id consistency for agent runs
CREATE OR REPLACE FUNCTION validate_agent_run_property_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.property_id != (
    SELECT property_id FROM hub_agents WHERE id = NEW.agent_id
  ) THEN
    RAISE EXCEPTION 'Agent run property_id must match agent property_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_run_property_id_validation
  BEFORE INSERT OR UPDATE ON hub_agent_runs
  FOR EACH ROW
  EXECUTE FUNCTION validate_agent_run_property_id();

-- Similar constraint for social content - ensure brief_id matches property_id if provided
CREATE OR REPLACE FUNCTION validate_social_content_brief()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.brief_id IS NOT NULL THEN
    IF NEW.property_id != (
      SELECT property_id FROM hub_brand_voice_briefs WHERE id = NEW.brief_id
    ) THEN
      RAISE EXCEPTION 'Social content property_id must match brief property_id';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_content_brief_validation
  BEFORE INSERT OR UPDATE ON hub_social_content
  FOR EACH ROW
  EXECUTE FUNCTION validate_social_content_brief();

-- Prevent scheduling content in the past (naive check - content should validate on UI)
CREATE OR REPLACE FUNCTION validate_social_content_schedule()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.scheduled_for IS NOT NULL AND NEW.scheduled_for < now() THEN
    RAISE EXCEPTION 'Cannot schedule content in the past';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_content_schedule_validation
  BEFORE INSERT OR UPDATE ON hub_social_content
  FOR EACH ROW
  EXECUTE FUNCTION validate_social_content_schedule();

-- Enforce valid status transitions (completed/failed can only come after running)
CREATE OR REPLACE FUNCTION validate_agent_run_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  old_status agent_run_status;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    SELECT status INTO old_status FROM hub_agent_runs WHERE id = NEW.id;

    -- Cannot go back to pending once started
    IF old_status IN ('running', 'completed', 'failed', 'cancelled')
       AND NEW.status = 'pending' THEN
      RAISE EXCEPTION 'Cannot transition agent run back to pending status';
    END IF;

    -- Can only go to completed/failed from running
    IF OLD.status != 'running'
       AND NEW.status IN ('completed', 'failed') THEN
      RAISE EXCEPTION 'Can only transition to completed/failed from running status';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_run_status_validation
  BEFORE UPDATE ON hub_agent_runs
  FOR EACH ROW
  EXECUTE FUNCTION validate_agent_run_status_transition();

-- Add CHECK constraint for valid cron expressions (basic format check)
ALTER TABLE hub_agents
ADD CONSTRAINT valid_cron_expression CHECK (
  schedule IS NULL OR
  schedule ~ '^\s*(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])-([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]))\s+(\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])|([0-9]|1[0-9]|2[0-3])-([0-9]|1[0-9]|2[0-3]))\s+(\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])|([1-9]|1[0-9]|2[0-9]|3[0-1])-([1-9]|1[0-9]|2[0-9]|3[0-1]))\s+(\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])|([1-9]|1[0-2])-([1-9]|1[0-2]))\s+(\*|([0-6])|\*\/([0-6])|([0-6])-([0-6]))\s*$'
);
