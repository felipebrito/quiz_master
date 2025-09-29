-- CreateTable
CREATE TABLE "game_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rounds_count" INTEGER NOT NULL DEFAULT 5,
    "round_duration" INTEGER NOT NULL DEFAULT 30,
    "question_duration" INTEGER NOT NULL DEFAULT 15,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "themes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_games" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "current_round" INTEGER NOT NULL DEFAULT 0,
    "started_at" DATETIME,
    "ended_at" DATETIME,
    "winner_id" TEXT,
    "config_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "games_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "game_configs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_games" ("created_at", "current_round", "ended_at", "id", "started_at", "status", "updated_at", "winner_id") SELECT "created_at", "current_round", "ended_at", "id", "started_at", "status", "updated_at", "winner_id" FROM "games";
DROP TABLE "games";
ALTER TABLE "new_games" RENAME TO "games";
CREATE TABLE "new_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "option_a" TEXT NOT NULL,
    "option_b" TEXT NOT NULL,
    "option_c" TEXT NOT NULL,
    "correct_answer" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "theme_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "questions_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "themes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_questions" ("correct_answer", "created_at", "difficulty", "id", "option_a", "option_b", "option_c", "text", "updated_at") SELECT "correct_answer", "created_at", "difficulty", "id", "option_a", "option_b", "option_c", "text", "updated_at" FROM "questions";
DROP TABLE "questions";
ALTER TABLE "new_questions" RENAME TO "questions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
