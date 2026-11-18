// Starts the web server: serves /public as the website and /api/* as the JSON API.
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import routes from "./routes.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());                                  // lets handlers read req.body
app.use(express.static(path.join(here, "..", "public"))); // the website
app.use("/api", routes);                                  // the API

// Anything that throws (including malformed JSON from a client) becomes a JSON error
// the page can display.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Game Logger running at http://localhost:${port}`);
});
