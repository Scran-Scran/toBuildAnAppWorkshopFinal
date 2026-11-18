// Wires the page together: loads games, draws them, and reacts to clicks and edits.

import { fetchGames, createGame, updateGame, deleteGame } from "./api.js";
import { gameCardHTML, calculateStats } from "./render.js";

const listEl = document.querySelector("#game-list");
const formEl = document.querySelector("#add-form");
const bannerEl = document.querySelector("#banner");
const statsEl = document.querySelector("#stats");

let games = [];

// ---- Messages ---------------------------------------------------------------

function showError(err) {
  console.error(err);
  bannerEl.textContent = err.message;
  bannerEl.hidden = false;
}

function clearError() {
  bannerEl.hidden = true;
}

// ---- Drawing the page -------------------------------------------------------

function render() {
  listEl.innerHTML = games.length
    ? games.map((game) => gameCardHTML(game)).join("")
    : `<p class="empty">No games yet. Add your first one above.</p>`;
  renderStats();
}

function renderStats() {
  const s = calculateStats(games);
  statsEl.innerHTML = `
    <span><strong>${s.total}</strong> games</span>
    <span><strong>${s.completed}</strong> completed</span>
    <span><strong>${s.totalHours}</strong> hours played</span>
    <span><strong>${s.averageRating ?? "-"}</strong> average rating</span>`;
  statsEl.hidden = false;
}

async function refresh() {
  games = await fetchGames();
  render();
}

// ---- Reacting to the user ---------------------------------------------------

// Add a game.
formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();
  const form = new FormData(formEl);
  try {
    await createGame({
      title: form.get("title"),
      platform: form.get("platform"),
      status: form.get("status"),
      rating: form.get("rating") === "" ? null : Number(form.get("rating")),
      hoursPlayed: form.get("hoursPlayed") === "" ? 0 : Number(form.get("hoursPlayed")),
      notes: form.get("notes"),
    });
    formEl.reset();
    await refresh();
  } catch (err) {
    showError(err);
  }
});

// Edit a game: any control with data-field saves its new value when it changes.
listEl.addEventListener("change", async (event) => {
  const field = event.target.dataset.field;
  if (!field) return;
  clearError();

  const id = Number(event.target.closest("[data-id]").dataset.id);
  let value = event.target.value;
  if (field === "rating") value = value === "" ? null : Number(value);
  if (field === "hoursPlayed") value = Number(value);

  try {
    await updateGame(id, { [field]: value });
    await refresh();
  } catch (err) {
    showError(err);
    render(); // put the control back to what's actually saved
  }
});

// Delete a game.
listEl.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action='delete']");
  if (!button) return;
  clearError();

  const id = Number(button.closest("[data-id]").dataset.id);
  const game = games.find((g) => g.id === id);
  if (!confirm(`Delete "${game?.title ?? "this game"}"?`)) return;

  try {
    await deleteGame(id);
    await refresh();
  } catch (err) {
    showError(err);
  }
});

refresh().catch(showError);
