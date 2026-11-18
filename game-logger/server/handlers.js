// One function per API route (see routes.js). Each one checks the request, calls db.js,
// and chooses the reply. Errors are sent as { error: "message" } so the page can show them.

import * as db from "./db.js";
import { validateGame } from "./validate.js";

const notFound = (res) => res.status(404).json({ error: "Game not found" });

/** GET /api/games: all games. */
export async function listGames(req, res) {
  res.json(await db.listGames());
}

/** GET /api/games/:id: one game, or 404. */
export async function getGame(req, res) {
  const game = await db.getGame(Number(req.params.id));
  if (!game) return notFound(res);
  res.json(game);
}

/** POST /api/games: create a game. 201 with the new game, or 400 if it's invalid. */
export async function createGame(req, res) {
  const errors = validateGame(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }
  const game = await db.addGame(req.body);
  res.status(201).json(game);
}

/** PATCH /api/games/:id: change some fields. 200 with the game, 400 if invalid, 404 if missing. */
export async function updateGame(req, res) {
  const errors = validateGame(req.body, { partial: true });
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }
  const game = await db.updateGame(Number(req.params.id), req.body ?? {});
  if (!game) return notFound(res);
  res.json(game);
}

/** DELETE /api/games/:id: 204 with no body, or 404 if there was no such game. */
export async function deleteGame(req, res) {
  const deleted = await db.deleteGame(Number(req.params.id));
  if (!deleted) return notFound(res);
  res.status(204).end();
}
