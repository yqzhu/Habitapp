CREATE TABLE "heroes" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL UNIQUE
);

CREATE TABLE "attributes" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "key" TEXT NOT NULL UNIQUE,
  "label" TEXT NOT NULL
);

CREATE TABLE "hero_stats" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "hero_id" INTEGER NOT NULL,
  "attribute_id" INTEGER NOT NULL,
  "level" INTEGER NOT NULL DEFAULT 0,
  "progress_gold" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "hero_stats_hero_id_fkey" FOREIGN KEY ("hero_id") REFERENCES "heroes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "hero_stats_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "hero_stats_hero_id_attribute_id_key" ON "hero_stats"("hero_id", "attribute_id");

CREATE TABLE "task_templates" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "title" TEXT NOT NULL,
  "cadence_rule" TEXT NOT NULL,
  "attribute" TEXT NOT NULL,
  "base_tier" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "task_instances" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "template_id" INTEGER,
  "scheduled_date" DATETIME NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "merged_group_key" TEXT
);

CREATE TABLE "cards_inventory" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "attribute" TEXT NOT NULL,
  "tier" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX "cards_inventory_attribute_tier_key" ON "cards_inventory"("attribute", "tier");

CREATE TABLE "adventures" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "chapter" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "requirements_json" TEXT NOT NULL,
  "branches_json" TEXT NOT NULL,
  "difficulty" INTEGER NOT NULL
);

CREATE TABLE "adventure_runs" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "adventure_id" INTEGER NOT NULL,
  "played_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "result_json" TEXT NOT NULL
);

CREATE TABLE "hint_store" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "hint_type" TEXT NOT NULL,
  "price_json" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "difficulty_band" INTEGER NOT NULL
);
