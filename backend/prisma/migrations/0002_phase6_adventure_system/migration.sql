ALTER TABLE "hint_store" ADD COLUMN "adventure_id" INTEGER;

CREATE TABLE "adventure_progress" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "adventure_id" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'LOCKED',
  "best_outcome" TEXT,
  "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "adventure_progress_adventure_id_fkey" FOREIGN KEY ("adventure_id") REFERENCES "adventures" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "adventure_progress_adventure_id_key" ON "adventure_progress"("adventure_id");
