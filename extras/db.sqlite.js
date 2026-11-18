// An alternative to server/db.js that stores games in SQLite instead of a JSON file.
// It exposes the same five functions, so nothing else in the app has to change.
//
// To use it:  cp extras/db.sqlite.js server/db.js   then   npm start
//
// Needs Node 22.5 or newer (it uses the built-in node:sqlite, so nothing to install).
// Node prints an "ExperimentalWarning" about SQLite; that is expected. The data lives
// in data/games.db, seeded from data/games.seed.json on first run.
//
// The tests read the JSON file directly, so they only pass with the JSON version of
// db.js.

import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = process.env.GAMES_DB ?? path.join(root, "data", "games.db");

let db;
function open() {
  if (db) return db;
  mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      platform    TEXT    NOT NULL DEFAULT '',
      status      TEXT    NOT NULL DEFAULT 'backlog',
      rating      INTEGER,
      hoursPlayed REAL    NOT NULL DEFAULT 0,
      notes       TEXT    NOT NULL DEFAULT ''
    )
  `);

  // First run: load the seed games so the table isn't empty.
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM games").get();
  if (n === 0) {
    const seed = JSON.parse(readFileSync(path.join(root, "data", "games.seed.json"), "utf8"));
    const insert = db.prepare(
      "INSERT INTO games (id, title, platform, status, rating, hoursPlayed, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    for (const g of seed) insert.run(g.id, g.title, g.platform, g.status, g.rating, g.hoursPlayed, g.notes);
  }
  return db;
}

// node:sqlite returns special row objects; copy them into plain objects.
const plain = (row) => (row ? { ...row } : null);

export async function listGames() {
  return open().prepare("SELECT * FROM games ORDER BY id").all().map(plain);
}

export async function getGame(id) {
  return plain(open().prepare("SELECT * FROM games WHERE id = ?").get(id));
}

export async function addGame(game) {
  const result = open()
    .prepare("INSERT INTO games (title, platform, status, rating, hoursPlayed, notes) VALUES (?, ?, ?, ?, ?, ?)")
    .run(
      game.title.trim(),
      game.platform ?? "",
      game.status ?? "backlog",
      game.rating ?? null,
      game.hoursPlayed ?? 0,
      game.notes ?? "",
    );
  return getGame(Number(result.lastInsertRowid));
}

// Safe to build SQL from this list because it's OUR constant, never user input.
// (Values always go through ? placeholders -- that's what prevents SQL injection.)
const EDITABLE_FIELDS = ["title", "platform", "status", "rating", "hoursPlayed", "notes"];

export async function updateGame(id, changes) {
  const existing = await getGame(id);
  if (!existing) return null;

  const fields = EDITABLE_FIELDS.filter((f) => f in changes);
  if (fields.length > 0) {
    const values = fields.map((f) => (f === "title" && typeof changes[f] === "string" ? changes[f].trim() : changes[f]));
    open()
      .prepare(`UPDATE games SET ${fields.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`)
      .run(...values, id);
  }
  return getGame(id);
}

export async function deleteGame(id) {
  return open().prepare("DELETE FROM games WHERE id = ?").run(id).changes > 0;
}
