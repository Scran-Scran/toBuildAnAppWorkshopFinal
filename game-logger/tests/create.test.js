// Creating games: validation, db, handler and api.
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { resetData, readData, fakeRes, mockFetch } from "./helpers.js";
import * as db from "../server/db.js";
import * as handlers from "../server/handlers.js";
import { validateGame } from "../server/validate.js";
import { createGame } from "../public/api.js";

beforeEach(() => resetData());

describe("server/validate.js", () => {
  it("accepts a game with just a title", () => {
    assert.deepEqual(validateGame({ title: "Tetris" }), []);
  });

  it("accepts a fully filled-in game", () => {
    const game = { title: "Tetris", platform: "Game Boy", status: "completed", rating: 5, hoursPlayed: 3.5, notes: "Classic" };
    assert.deepEqual(validateGame(game), []);
  });

  it("accepts rating: null (unrated)", () => {
    assert.deepEqual(validateGame({ title: "Tetris", rating: null }), []);
  });

  it("requires a title", () => {
    assert.ok(validateGame({}).some((e) => /title/i.test(e)));
    assert.ok(validateGame({ title: "   " }).some((e) => /title/i.test(e)));
    assert.ok(validateGame({ title: 42 }).some((e) => /title/i.test(e)));
  });

  it("doesn't crash when there is no body at all", () => {
    assert.ok(validateGame(undefined).some((e) => /title/i.test(e)));
  });

  it("rejects an unknown status", () => {
    assert.ok(validateGame({ title: "X", status: "winning" }).some((e) => /status/i.test(e)));
  });

  it("rejects a rating that is not a whole number from 1 to 5", () => {
    for (const rating of [0, 6, 2.5, "5", -1]) {
      assert.ok(
        validateGame({ title: "X", rating }).some((e) => /rating/i.test(e)),
        `rating ${JSON.stringify(rating)} should be rejected`,
      );
    }
  });

  it("rejects negative or non-numeric hours", () => {
    for (const hoursPlayed of [-1, "ten", NaN]) {
      assert.ok(
        validateGame({ title: "X", hoursPlayed }).some((e) => /hours/i.test(e)),
        `hoursPlayed ${JSON.stringify(hoursPlayed)} should be rejected`,
      );
    }
  });

  it("reports every problem, not just the first", () => {
    const errors = validateGame({ status: "nope", rating: 9 });
    assert.ok(errors.length >= 3);
  });
});

describe("server/db.js", () => {
  it("addGame() fills in defaults and returns the new game", async () => {
    const game = await db.addGame({ title: "Tetris" });
    assert.deepEqual(game, {
      id: 4, title: "Tetris", platform: "", status: "backlog",
      rating: null, hoursPlayed: 0, notes: "",
    });
  });

  it("addGame() keeps the values you give it and trims the title", async () => {
    const game = await db.addGame({ title: "  Tetris  ", platform: "Game Boy", status: "completed", rating: 5, hoursPlayed: 3, notes: "ok" });
    assert.equal(game.title, "Tetris");
    assert.equal(game.platform, "Game Boy");
    assert.equal(game.status, "completed");
    assert.equal(game.rating, 5);
  });

  it("addGame() saves to the file", async () => {
    await db.addGame({ title: "Tetris" });
    const saved = readData();
    assert.equal(saved.length, 4);
    assert.equal(saved.at(-1).title, "Tetris");
  });

  it("each new game gets a new id", async () => {
    const a = await db.addGame({ title: "A" });
    const b = await db.addGame({ title: "B" });
    assert.equal(b.id, a.id + 1);
  });

  it("the first game in an empty list gets id 1", async () => {
    resetData([]);
    const game = await db.addGame({ title: "First" });
    assert.equal(game.id, 1);
  });

  it("addGame() ignores a client-supplied id", async () => {
    const game = await db.addGame({ id: 1, title: "Sneaky" });
    assert.equal(game.id, 4);
    assert.equal(readData().filter((g) => g.id === 1).length, 1);
  });
});

describe("server/handlers.js", () => {
  it("createGame saves the game and responds 201 with it", async () => {
    const res = fakeRes();
    await handlers.createGame({ body: { title: "Tetris", rating: 4 } }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.title, "Tetris");
    assert.equal(res.body.id, 4);
    assert.equal(readData().length, 4);
  });

  it("createGame responds 400 with { error } and saves nothing when invalid", async () => {
    const res = fakeRes();
    await handlers.createGame({ body: { title: "", rating: 99 } }, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /title/i);
    assert.match(res.body.error, /rating/i);
    assert.equal(readData().length, 3);
  });

  it("createGame survives a missing body", async () => {
    const res = fakeRes();
    await handlers.createGame({}, res);
    assert.equal(res.statusCode, 400);
  });
});

describe("public/api.js", () => {
  it("createGame() POSTs the game as JSON to /api/games", async () => {
    const calls = mockFetch({ status: 201, body: { id: 4, title: "Tetris" } });
    const created = await createGame({ title: "Tetris", rating: 4 });
    assert.equal(calls[0].url, "/api/games");
    assert.equal(calls[0].method, "POST");
    assert.match(calls[0].headers.get("content-type"), /application\/json/);
    assert.deepEqual(JSON.parse(calls[0].body), { title: "Tetris", rating: 4 });
    assert.equal(created.id, 4);
  });

  it("createGame() throws the server's validation message", async () => {
    mockFetch({ status: 400, body: { error: "Title is required" } });
    await assert.rejects(createGame({ title: "" }), { message: "Title is required" });
  });
});
