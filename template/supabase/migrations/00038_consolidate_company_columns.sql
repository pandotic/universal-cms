-- Consolidate duplicate columns from 00026 that were superseded by 00027.
-- Migrates city+country → headquarters, size_range → employee_range,
-- linkedin_url → company_links, then drops the old columns.

-- =============================================================================
-- 1. Copy old data → new columns where new is NULL
-- =============================================================================

UPDATE companies
SET headquarters = COALESCE(headquarters, CONCAT_WS(', ', NULLIF(city, ''), NULLIF(country, '')))
WHERE headquarters IS NULL AND (city IS NOT NULL OR country IS NOT NULL);

UPDATE companies
SET employee_range = COALESCE(employee_range, size_range)
WHERE employee_range IS NULL AND size_range IS NOT NULL;

-- =============================================================================
-- 2. Migrate linkedin_url → company_links
-- =============================================================================

INSERT INTO company_links (company_id, link_type, url, source, confidence)
SELECT id, 'linkedin', linkedin_url, 'migration', 1.0
FROM companies
WHERE linkedin_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM company_links cl
    WHERE cl.company_id = companies.id AND cl.link_type = 'linkedin'
  );

-- =============================================================================
-- 3. Drop old columns
-- =============================================================================

ALTER TABLE companies DROP COLUMN IF EXISTS city;
ALTER TABLE companies DROP COLUMN IF EXISTS country;
ALTER TABLE companies DROP COLUMN IF EXISTS size_range;
ALTER TABLE companies DROP COLUMN IF EXISTS linkedin_url;
