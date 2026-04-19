-- 00118_hub_property_versioning.sql
-- Adds package-version tracking fields to hub_properties so the Hub can drive
-- per-property, asynchronous rollouts of @pandotic/universal-cms updates.
--
-- package_version        : version currently deployed on the site
-- target_package_version : version the operator wants the site to be on
-- last_module_sync_at    : when the consuming site last pulled its module
--                          config from the Hub (nullable = pending sync)

ALTER TABLE hub_properties
  ADD COLUMN IF NOT EXISTS package_version text,
  ADD COLUMN IF NOT EXISTS target_package_version text,
  ADD COLUMN IF NOT EXISTS last_module_sync_at timestamptz;
