-- Backfill agents from the free-text applications.agentName, then link.
--
-- Order matters: create the agent rows FIRST, then point applications at them.
-- Dropping agentName before this ran would lose every existing association with
-- no way to recover it. The column itself is dropped in a later migration, once
-- this backfill has shipped everywhere.

-- 1. One agent row per distinct non-empty name.
INSERT INTO "agents" ("publicId", "tenantId", "name", "createdAt", "updatedAt")
SELECT gen_random_uuid(), a."tenantId", TRIM(a."agentName"), NOW(), NOW()
FROM (
  SELECT DISTINCT "tenantId", "agentName"
  FROM "applications"
  WHERE "agentName" IS NOT NULL AND TRIM("agentName") <> ''
) a
ON CONFLICT ("tenantId", "name") DO NOTHING;

-- 2. Link each application to the agent matching its old text value.
UPDATE "applications" ap
SET "agentId" = ag."id"
FROM "agents" ag
WHERE ap."agentId" IS NULL
  AND ap."agentName" IS NOT NULL
  AND TRIM(ap."agentName") <> ''
  AND ag."tenantId" = ap."tenantId"
  AND ag."name" = TRIM(ap."agentName");
