// Updating games: partial validation, db, handler, api and card controls.
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { resetData, readData, fakeRes, mockFetch, fixture } from "./helpers.js";
import * as db from "../server/db.js";
import * as handlers from "../server/handlers.js";
import { validateGame } from "../server/validate.js";
import { updateGame } from "../public/api.js";
import { gameCardHTML } from "../public/render.js";

beforeEach(() => resetData());

describe("server/validate.js with { partial: true }", () => {
  it("doesn't require a title", () => {
    assert.deepEqual(validateGame({ status: "playing" }, { partial: true }), []);
  });

  it("accepts an empty set of changes", () => {
    assert.deepEqual(validateGame({}, { partial: true }), []);
  });

  it("still rejects bad values in the fields that are present", () => {
    assert.ok(validateGame({ rating: 10 }, { partial: true }).some((e) => /rating/i.test(e)));
    assert.ok(validateGame({ status: "nope" }, { partial: true }).some((e) => /status/i.test(e)));
  });

  it("a title that IS present can't be blank", () => {
    assert.ok(validateGame({ title: " " }, { partial: true }).some((e) => /title/i.test(e)));
  });

  it("without partial, a title is still required", () => {
    assert.ok(validateGame({ status: "playing" }).some((e) => /title/i.test(e)));
  });
});

describe("server/db.js", () => {
  it("updateGame() changes only the fields you pass and returns the game", async () => {
    const updated = await db.updateGame(3, { status: "completed", rating: 5 });
    assert.deepEqual(updated, { ...fixture()[2], status: "completed", rating: 5 });
  });

  it("updateGame() saves to the file and leaves other games alone", async () => {
    await db.updateGame(3, { hoursPlayed: 99 });
    const saved = readData();
    assert.equal(saved.find((g) => g.id === 3).hoursPlayed, 99);
    assert.deepEqual(saved.find((g) => g.id === 1), fixture()[0]);
  });

  it("updateGame() returns null for an unknown id and saves nothing", async () => {
    assert.equal(await db.updateGame(999, { title: "Ghost" }), null);
    assert.deepEqual(readData(), fixture());
  });

  it("the id can never be changed", async () => {
    const updated = await db.updateGame(1, { id: 99, title: "Hades II" });
    assert.equal(updated.id, 1);
    assert.equal(updated.title, "Hades II");
    assert.deepEqual(readData().map((g) => g.id), [1, 2, 3]);
  });

  it("unknown fields are not saved", async () => {
    const updated = await db.updateGame(1, { isAdmin: true });
    assert.equal("isAdmin" in updated, false);
    assert.equal("isAdmin" in readData()[0], false);
  });
});

describe("server/handlers.js", () => {
  it("updateGame responds with the updated game", async () => {
    const res = fakeRes();
    await handlers.updateGame({ params: { id: "3" }, body: { status: "completed" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, "completed");
    assert.equal(readData().find((g) => g.id === 3).status, "completed");
  });

  it("updateGame responds 400 and saves nothing when the changes are invalid", async () => {
    const res = fakeRes();
    await handlers.updateGame({ params: { id: "3" }, body: { rating: 10 } }, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /rating/i);
    assert.deepEqual(readData(), fixture());
  });

  it("updateGame responds 404 for an unknown id", async () => {
    const res = fakeRes();
    await handlers.updateGame({ params: { id: "999" }, body: { status: "playing" } }, res);
    assert.equal(res.statusCode, 404);
    assert.equal(typeof res.body.error, "string");
  });

  it("updateGame responds 404 when the id isn't a number", async () => {
    const res = fakeRes();
    await handlers.updateGame({ params: { id: "abc" }, body: { status: "playing" } }, res);
    assert.equal(res.statusCode, 404);
  });
});

describe("public/api.js", () => {
  it("updateGame() PATCHes only the changes to /api/games/:id", async () => {
    const calls = mockFetch({ body: { id: 3, status: "completed" } });
    const updated = await updateGame(3, { status: "completed" });
    assert.equal(calls[0].url, "/api/games/3");
    assert.equal(calls[0].method, "PATCH");
    assert.match(calls[0].headers.get("content-type"), /application\/json/);
    assert.deepEqual(JSON.parse(calls[0].body), { status: "completed" });
    assert.equal(updated.status, "completed");
  });
});

describe("public/render.js -- editable controls on the card", () => {
  const game = fixture()[0]; // Hades: completed, rating 5, 42 hours

  it("has a status <select> with the current status selected", () => {
    const html = gameCardHTML(game);
    assert.match(html, /<select[^>]*data-field="status"/);
    assert.match(html, /value="completed"\s+selected/);
    assert.doesNotMatch(html, /value="playing"\s+selected/);
  });

  it("has a rating <select> with the current rating selected", () => {
    const html = gameCardHTML(game);
    assert.match(html, /<select[^>]*data-field="rating"/);
    assert.match(html, /value="5"\s+selected/);
  });

  it("selects 'Unrated' (empty value) when rating is null", () => {
    const html = gameCardHTML(fixture()[2]);
    assert.match(html, /value=""\s+selected/);
  });

  it("has an hours <input> showing the current hours", () => {
    const html = gameCardHTML(game);
    assert.match(html, /<input[^>]*data-field="hoursPlayed"/);
    assert.match(html, /<input[^>]*value="42"/);
  });
});
