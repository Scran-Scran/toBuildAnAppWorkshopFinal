// Decides whether a game sent by the browser is allowed to be saved.
// Never trust the front end: anyone can send anything to the API, so the server checks.

export const STATUSES = ["backlog", "playing", "completed", "dropped"];

/**
 * Returns an array of error messages; an empty array means the game is valid.
 *
 *   title        required, a non-empty string
 *   platform     optional, a string
 *   status       optional, one of STATUSES
 *   rating       optional, null or a whole number from 1 to 5
 *   hoursPlayed  optional, a number that is 0 or more
 *   notes        optional, a string
 *
 * With { partial: true } (used for updates, which only send what changed) even the
 * title is optional, but any field that is present must still follow the rules.
 */
export function validateGame(game, { partial = false } = {}) {
  const g = game ?? {};
  const errors = [];

  if (g.title !== undefined || !partial) {
    if (typeof g.title !== "string" || g.title.trim() === "") {
      errors.push("Title is required and can't be blank");
    }
  }

  if (g.platform !== undefined && typeof g.platform !== "string") {
    errors.push("Platform must be text");
  }

  if (g.status !== undefined && !STATUSES.includes(g.status)) {
    errors.push(`Status must be one of: ${STATUSES.join(", ")}`);
  }

  if (g.rating !== undefined && g.rating !== null) {
    if (!Number.isInteger(g.rating) || g.rating < 1 || g.rating > 5) {
      errors.push("Rating must be a whole number from 1 to 5 (or empty)");
    }
  }

  if (g.hoursPlayed !== undefined) {
    if (typeof g.hoursPlayed !== "number" || !Number.isFinite(g.hoursPlayed) || g.hoursPlayed < 0) {
      errors.push("Hours played must be a number, 0 or more");
    }
  }

  if (g.notes !== undefined && typeof g.notes !== "string") {
    errors.push("Notes must be text");
  }

  return errors;
}
