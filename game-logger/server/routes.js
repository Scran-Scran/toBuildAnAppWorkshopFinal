// Maps each URL to the handler that answers it. The whole API on one screen.
import { Router } from "express";
import * as handlers from "./handlers.js";

const router = Router();

router.get("/games", handlers.listGames);          // read all
router.get("/games/:id", handlers.getGame);        // read one
router.post("/games", handlers.createGame);        // create
router.patch("/games/:id", handlers.updateGame);   // update (only the fields sent)
router.delete("/games/:id", handlers.deleteGame);  // delete

router.use((req, res) => res.status(404).json({ error: "No such API route" }));

export default router;
