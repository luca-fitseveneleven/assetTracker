-- Backfill organizationId on all entity records that have it as NULL.
-- Assigns them to the first organization found (by creation date).
-- This enables strict org scoping (no more inclusive null fallback).

SET search_path TO "assettool";

-- Get the first organization ID into a variable via a DO block
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  SELECT "id" INTO default_org_id
  FROM "Organization"
  WHERE "isActive" = true
  ORDER BY "createdAt" ASC
  LIMIT 1;

  -- Skip if no organization exists
  IF default_org_id IS NULL THEN
    RAISE NOTICE 'No organization found — skipping backfill';
    RETURN;
  END IF;

  RAISE NOTICE 'Backfilling organizationId with org: %', default_org_id;

  -- Core entities
  UPDATE "asset"
    SET "organizationId" = default_org_id
    WHERE "organizationId" IS NULL;

  UPDATE "accessories"
    SET "organizationId" = default_org_id
    WHERE "organizationId" IS NULL;

  UPDATE "consumable"
    SET "organizationId" = default_org_id
    WHERE "organizationId" IS NULL;

  UPDATE "licence"
    SET "organizationId" = default_org_id
    WHERE "organizationId" IS NULL;

  UPDATE "user"
    SET "organizationId" = default_org_id
    WHERE "organizationId" IS NULL;

  -- Supporting entities
  UPDATE "Component"
    SET "organizationId" = default_org_id
    WHERE "organizationId" IS NULL;

  UPDATE "Webhook"
    SET "organizationId" = default_org_id
    WHERE "organizationId" IS NULL;

  UPDATE "AutomationRule"
    SET "organizationId" = default_org_id
    WHERE "organizationId" IS NULL;

  UPDATE "EulaTemplate"
    SET "organizationId" = default_org_id
    WHERE "organizationId" IS NULL;

  UPDATE "kit"
    SET "organizationId" = default_org_id
    WHERE "organizationId" IS NULL;

END $$;
