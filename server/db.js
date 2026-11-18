// Storage for games: a JSON file at data/games.json, created from data/games.seed.json
// on first run. The rest of the app only uses the five exported functions below, so the
// storage can be swapped (see extras/db.sqlite.js) without touching anything else.
//
// A game looks like this:
//   { id: 1, title: "Hades", platform: "PC", status: "completed",
//     rating: 5, hoursPlayed: 42, notes: "Best run: Zagreus + Hammer" }
//
// The file is read fresh on every call (no caching), so edits made by hand show up
// immediately.

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function dataFile() {
  // Tests set GAMES_FILE so they never touch real data.
  return process.env.GAMES_FILE ?? path.join(root, "data", "games.json");
}

async function readAll() {
  try {
    return JSON.parse(await readFile(dataFile(), "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    await mkdir(path.dirname(dataFile()), { recursive: true });
    await copyFile(path.join(root, "data", "games.seed.json"), dataFile());
    return JSON.parse(await readFile(dataFile(), "utf8"));
  }
}

async function writeAll(games) {
  await writeFile(dataFile(), JSON.stringify(games, null, 2) + "\n");
}

/** Every game, as an array. */
export async function listGames() {
  return readAll();
}

/** The game with this id, or null if there isn't one. */
export async function getGame(id) {
  const games = await readAll();
  return games.find((game) => game.id === id) ?? null;
}

/**
 * Saves a new game and returns it. The id is always assigned here (one higher than the
 * largest existing id), never taken from the caller, and missing fields get defaults.
 */
export async function addGame(game) {
  const games = await readAll();
  const nextId = games.reduce((max, g) => Math.max(max, g.id), 0) + 1;

  const newGame = {
    id: nextId,
    title: game.title.trim(),
    platform: game.platform ?? "",
    status: game.status ?? "backlog",
    rating: game.rating ?? null,
    hoursPlayed: game.hoursPlayed ?? 0,
    notes: game.notes ?? "",
  };

  games.push(newGame);
  await writeAll(games);
  return newGame;
}

const EDITABLE_FIELDS = ["title", "platform", "status", "rating", "hoursPlayed", "notes"];

/**
 * Changes some fields of an existing game and returns the updated game, or null if
 * there is no game with this id. Only EDITABLE_FIELDS are copied over, so the id and
 * any unknown fields can never be changed by the caller.
 */
export async function updateGame(id, changes) {
  const games = await readAll();
  const index = games.findIndex((game) => game.id === id);
  if (index === -1) return null;

  const allowed = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in changes) allowed[field] = changes[field];
  }
  if (typeof allowed.title === "string") allowed.title = allowed.title.trim();

  games[index] = { ...games[index], ...allowed };
  await writeAll(games);
  return games[index];
}

/** Removes the game with this id. Returns true if one was removed, false if not. */
export async function deleteGame(id) {
  const games = await readAll();
  const remaining = games.filter((game) => game.id !== id);
  if (remaining.length === games.length) return false;
  await writeAll(remaining);
  return true;
}
