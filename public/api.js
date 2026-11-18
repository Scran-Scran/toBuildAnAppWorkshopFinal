// The front end's connection to the server. Each function sends a request to a route
// defined in server/routes.js and returns the answer.

/**
 * Wraps fetch(): sends `options.body` as JSON, throws an Error carrying the server's
 * message when the response isn't ok, returns null for a 204 (no body), and otherwise
 * returns the parsed JSON.
 */
async function request(url, options = {}) {
  const init = { ...options };
  if (options.body !== undefined) {
    init.headers = { "Content-Type": "application/json", ...options.headers };
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // The body wasn't JSON; keep the generic message.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

/** GET /api/games: array of games. */
export async function fetchGames() {
  return request("/api/games");
}

/** POST /api/games: the created game. */
export async function createGame(game) {
  return request("/api/games", { method: "POST", body: game });
}

/** PATCH /api/games/:id: the updated game. `changes` holds only the fields that changed. */
export async function updateGame(id, changes) {
  return request(`/api/games/${id}`, { method: "PATCH", body: changes });
}

/** DELETE /api/games/:id: resolves to null. */
export async function deleteGame(id) {
  return request(`/api/games/${id}`, { method: "DELETE" });
}
