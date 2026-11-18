// Deleting games: db, handler, api and the delete button.
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { resetData, readData, fakeRes, mockFetch, fixture } from "./helpers.js";
import * as db from "../server/db.js";
import * as handlers from "../server/handlers.js";
import { deleteGame } from "../public/api.js";
import { gameCardHTML } from "../public/render.js";

beforeEach(() => resetData());

describe("server/db.js", () => {
  it("deleteGame() removes the game, saves, and returns true", async () => {
    assert.equal(await db.deleteGame(2), true);
    assert.deepEqual(readData().map((g) => g.id), [1, 3]);
  });

  it("deleteGame() returns false for an unknown id and changes nothing", async () => {
    assert.equal(await db.deleteGame(999), false);
    assert.deepEqual(readData(), fixture());
  });
});

describe("server/handlers.js", () => {
  it("deleteGame responds 204 with no body when it deleted something", async () => {
    const res = fakeRes();
    await handlers.deleteGame({ params: { id: "2" } }, res);
    assert.equal(res.statusCode, 204);
    assert.equal(res.ended, true);
    assert.equal(res.body, undefined);
    assert.equal(readData().length, 2);
  });

  it("deleteGame responds 404 for an unknown id", async () => {
    const res = fakeRes();
    await handlers.deleteGame({ params: { id: "999" } }, res);
    assert.equal(res.statusCode, 404);
    assert.equal(typeof res.body.error, "string");
  });

  it("deleteGame responds 404 when the id isn't a number", async () => {
    const res = fakeRes();
    await handlers.deleteGame({ params: { id: "abc" } }, res);
    assert.equal(res.statusCode, 404);
    assert.equal(readData().length, 3);
  });
});

describe("public/api.js", () => {
  it("deleteGame() sends DELETE to /api/games/:id and resolves to null", async () => {
    const calls = mockFetch({ status: 204 });
    const result = await deleteGame(2);
    assert.equal(calls[0].url, "/api/games/2");
    assert.equal(calls[0].method, "DELETE");
    assert.equal(result, null);
  });

  it("deleteGame() throws the server's message on failure", async () => {
    mockFetch({ status: 404, body: { error: "Game not found" } });
    await assert.rejects(deleteGame(999), { message: "Game not found" });
  });
});

describe("public/render.js -- delete button on the card", () => {
  it("has a button marked data-action=\"delete\"", () => {
    const html = gameCardHTML(fixture()[0]);
    assert.match(html, /<button[^>]*data-action="delete"/);
  });
});
