// Reading games: db, handlers, api and rendering.
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { resetData, fixture, fakeRes, mockFetch } from "./helpers.js";
import * as db from "../server/db.js";
import * as handlers from "../server/handlers.js";
import { fetchGames } from "../public/api.js";
import { gameCardHTML } from "../public/render.js";

beforeEach(() => resetData());

describe("server/db.js", () => {
  it("listGames() returns every game", async () => {
    assert.deepEqual(await db.listGames(), fixture());
  });

  it("getGame(id) returns the matching game", async () => {
    const game = await db.getGame(2);
    assert.equal(game.title, "Celeste");
  });

  it("getGame(id) returns null when there is no such game", async () => {
    assert.equal(await db.getGame(999), null);
  });
});

describe("server/handlers.js", () => {
  it("listGames responds with all games", async () => {
    const res = fakeRes();
    await handlers.listGames({}, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, fixture());
  });

  it("getGame responds with one game (the id arrives as a string)", async () => {
    const res = fakeRes();
    await handlers.getGame({ params: { id: "1" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.title, "Hades");
  });

  it("getGame responds 404 with { error } for an unknown id", async () => {
    const res = fakeRes();
    await handlers.getGame({ params: { id: "999" } }, res);
    assert.equal(res.statusCode, 404);
    assert.equal(typeof res.body.error, "string");
  });

  it("getGame responds 404 when the id isn't a number", async () => {
    const res = fakeRes();
    await handlers.getGame({ params: { id: "abc" } }, res);
    assert.equal(res.statusCode, 404);
  });
});

describe("public/api.js", () => {
  it("fetchGames() GETs /api/games and returns the parsed JSON", async () => {
    const calls = mockFetch({ body: fixture() });
    const games = await fetchGames();
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "/api/games");
    assert.equal(calls[0].method, "GET");
    assert.deepEqual(games, fixture());
  });

  it("throws the server's error message when the response is not ok", async () => {
    mockFetch({ status: 500, body: { error: "Database exploded" } });
    await assert.rejects(fetchGames(), { message: "Database exploded" });
  });
});

describe("public/render.js", () => {
  it("gameCardHTML() puts the game's id on the outer element", () => {
    const html = gameCardHTML(fixture()[0]);
    assert.match(html, /data-id="1"/);
  });

  it("shows the title, platform and notes", () => {
    const html = gameCardHTML(fixture()[0]);
    assert.match(html, /Hades/);
    assert.match(html, /PC/);
    assert.match(html, /Zagreus \+ Hammer/);
  });

  it("escapes user-typed text so it can't inject HTML", () => {
    const evil = { ...fixture()[0], title: "<script>alert(1)</script>", notes: '"><img src=x>' };
    const html = gameCardHTML(evil);
    assert.doesNotMatch(html, /<script>/);
    assert.doesNotMatch(html, /<img/);
    assert.match(html, /&lt;script&gt;/);
  });
});
