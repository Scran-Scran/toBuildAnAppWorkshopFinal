# Game Log

A small video game logger. Add the games you're playing, rate them, change their status, track your hours, and delete the ones you're done with. Express serves a JSON API and a plain JavaScript front end, and the data lives in a JSON file on your machine.

## Run it

You need [Node.js](https://nodejs.org) 20 or newer (or open the repo in a Codespace, where it's already set up).

```bash
npm install
npm start
```

Open <http://localhost:3000>. Use `npm run dev` instead to restart the server automatically when server files change.

Your games are saved in `data/games.json`, created from `data/games.seed.json` on first run. `npm run reset` restores the six sample games. Edit the file by hand while the app is running and the page shows the change on refresh.

## How it fits together

```
browser: app.js → api.js → HTTP → routes.js → handlers.js → db.js → data/games.json
                                                  ↑
                                              validate.js
```

| File | Job |
|---|---|
| `server/index.js` | Starts Express, serves `public/` and mounts the API |
| `server/routes.js` | Maps each URL and method to a handler |
| `server/handlers.js` | Checks the request, calls the database, picks the reply |
| `server/validate.js` | Decides what is allowed to be saved |
| `server/db.js` | Reads and writes `data/games.json` |
| `public/index.html`, `style.css` | The page and its look |
| `public/app.js` | Wires clicks and edits to the functions below |
| `public/api.js` | Talks to the server with `fetch()` |
| `public/render.js` | Turns game data into HTML and computes the stats |

## API

| Action | Request | Success | Errors |
|---|---|---|---|
| List games | `GET /api/games` | 200, array of games | |
| Get one | `GET /api/games/:id` | 200, the game | 404 |
| Create | `POST /api/games` | 201, the new game | 400 |
| Update | `PATCH /api/games/:id` | 200, the updated game | 400, 404 |
| Delete | `DELETE /api/games/:id` | 204, no body | 404 |

Errors look like `{ "error": "message" }`. A game looks like this:

```json
{ "id": 1, "title": "Hades", "platform": "PC", "status": "completed",
  "rating": 5, "hoursPlayed": 42, "notes": "Best run: Zagreus + Hammer" }
```

| Field | Rules |
|---|---|
| `title` | Required, non-blank text |
| `platform`, `notes` | Optional text |
| `status` | `backlog` (default), `playing`, `completed` or `dropped` |
| `rating` | `null` (default) or a whole number from 1 to 5 |
| `hoursPlayed` | A number, 0 or more (default 0) |

The server assigns `id`; any `id` sent by a client is ignored, and an update can never change it.

## Tests

```bash
npm test
```

Tests use Node's built-in runner, so there is nothing extra to install. They run against a temporary data file and never touch `data/games.json`.

## Switching to SQLite

`extras/db.sqlite.js` provides the same five functions backed by SQLite. Copy it over `server/db.js` and restart; nothing else changes. It needs Node 22.5 or newer, and the tests only apply to the JSON version.

```bash
cp extras/db.sqlite.js server/db.js
```
