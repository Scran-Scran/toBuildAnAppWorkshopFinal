// The stats summary.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fixture } from "./helpers.js";
import { calculateStats } from "../public/render.js";

describe("calculateStats()", () => {
  it("counts games, completed games and total hours", () => {
    const stats = calculateStats(fixture());
    assert.equal(stats.total, 3);
    assert.equal(stats.completed, 2);
    assert.equal(stats.totalHours, 84);
  });

  it("averages only the games that have a rating", () => {
    // Fixture ratings: 5, 4, and one unrated -> (5 + 4) / 2
    assert.equal(calculateStats(fixture()).averageRating, 4.5);
  });

  it("rounds the average to one decimal place", () => {
    const games = [5, 4, 4].map((rating, i) => ({ ...fixture()[0], id: i + 1, rating }));
    assert.equal(calculateStats(games).averageRating, 4.3);
  });

  it("averageRating is null when nothing is rated", () => {
    const games = fixture().map((g) => ({ ...g, rating: null }));
    assert.equal(calculateStats(games).averageRating, null);
  });

  it("handles an empty list", () => {
    assert.deepEqual(calculateStats([]), { total: 0, completed: 0, totalHours: 0, averageRating: null });
  });
});
