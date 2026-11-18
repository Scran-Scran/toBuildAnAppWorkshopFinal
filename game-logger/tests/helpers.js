// Shared test setup.
// Points the data file at a throwaway temp file so tests never touch real data.
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const dir = mkdtempSync(path.join(tmpdir(), "game-logger-"));
export const DATA_FILE = path.join(dir, "games.json");
process.env.GAMES_FILE = DATA_FILE;

const FIXTURE = [
  { id: 1, title: "Hades", platform: "PC", status: "completed", rating: 5, hoursPlayed: 42, notes: "Best run: Zagreus + Hammer" },
  { id: 2, title: "Celeste", platform: "Switch", status: "completed", rating: 4, hoursPlayed: 12, notes: "" },
  { id: 3, title: "Elden Ring", platform: "PC", status: "playing", rating: null, hoursPlayed: 30, notes: "Stuck on a boss" },
];

/** A fresh copy of the sample games. */
export const fixture = () => structuredClone(FIXTURE);

/** Put the data file back to a known state (default: the three sample games). */
export function resetData(games = fixture()) {
  writeFileSync(DATA_FILE, JSON.stringify(games));
}

/** Read whatever is currently saved in the data file. */
export function readData() {
  return JSON.parse(readFileSync(DATA_FILE, "utf8"));
}

/** A stand-in for Express's `res`, which records what a handler did. */
export function fakeRes() {
  return {
    statusCode: 200,
    body: undefined,
    ended: false,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    end() { this.ended = true; return this; },
  };
}

/** Pretend the browser's fetch() answered with this; records every call made. */
export function mockFetch({ status = 200, body = {} } = {}) {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({
      url: String(url),
      method: (options.method ?? "GET").toUpperCase(),
      headers: new Headers(options.headers ?? {}),
      body: options.body,
    });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        if (status === 204) throw new Error("A 204 response has no body; don't call .json() on it");
        return body;
      },
    };
  };
  return calls;
}
