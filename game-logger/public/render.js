// Turns data into HTML. These are plain functions (data in, string out) with no DOM
// access, which keeps them easy to test. app.js puts the strings on the page.

export const STATUSES = ["backlog", "playing", "completed", "dropped"];

/**
 * Makes text safe to put inside HTML. Always run user-typed text through this: without
 * it, a game titled <script>alert(1)</script> would run as code (an XSS bug).
 */
export function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Builds <option> tags for a <select>; the one matching `current` is selected. */
export function optionsHTML(options, current) {
  const selected = String(current ?? "");
  return options
    .map((o) => {
      const isSelected = o.value === selected ? " selected" : "";
      return `<option value="${escapeHTML(o.value)}"${isSelected}>${escapeHTML(o.label)}</option>`;
    })
    .join("");
}

export const STATUS_OPTIONS = STATUSES.map((s) => ({
  value: s,
  label: s[0].toUpperCase() + s.slice(1),
}));

export const RATING_OPTIONS = [
  { value: "", label: "Unrated" },
  ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: "★".repeat(n) })),
];

/**
 * The HTML for one game card. Controls carry a data-field naming the game property they
 * edit, and the delete button carries data-action="delete"; app.js listens for both.
 */
export function gameCardHTML(game) {
  return `
    <article class="game-card" data-id="${escapeHTML(game.id)}" data-status="${escapeHTML(game.status)}">
      <h3>${escapeHTML(game.title)}</h3>
      <p class="platform">${escapeHTML(game.platform)}</p>
      <p class="notes">${escapeHTML(game.notes)}</p>

      <div class="controls">
        <label>Status
          <select data-field="status">${optionsHTML(STATUS_OPTIONS, game.status)}</select>
        </label>
        <label>Rating
          <select data-field="rating">${optionsHTML(RATING_OPTIONS, game.rating)}</select>
        </label>
        <label>Hours
          <input data-field="hoursPlayed" type="number" min="0" step="0.5" value="${escapeHTML(game.hoursPlayed)}">
        </label>
      </div>

      <button class="delete" data-action="delete">Delete</button>
    </article>`;
}

/**
 * Summary numbers for the stats bar. The average rating only counts rated games,
 * rounded to one decimal, and is null when nothing is rated.
 */
export function calculateStats(games) {
  const rated = games.filter((g) => typeof g.rating === "number");
  const ratingSum = rated.reduce((sum, g) => sum + g.rating, 0);

  return {
    total: games.length,
    completed: games.filter((g) => g.status === "completed").length,
    totalHours: games.reduce((sum, g) => sum + (g.hoursPlayed || 0), 0),
    averageRating: rated.length ? Math.round((ratingSum / rated.length) * 10) / 10 : null,
  };
}
