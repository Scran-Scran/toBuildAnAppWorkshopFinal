// npm run reset  ->  throw away your data and start again from the seed file.
import { copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
await copyFile(
  path.join(root, "data", "games.seed.json"),
  path.join(root, "data", "games.json"),
);
console.log("data/games.json reset from data/games.seed.json");
