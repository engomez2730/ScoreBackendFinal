import express from "express";
import * as playerController from "../controllers/playerController.js";

const router = express.Router();

router.get("/", playerController.getPlayers);
router.get("/team/:teamId", playerController.getPlayersByTeam);
router.get("/:id", playerController.getPlayer);
router.post("/", playerController.createPlayer);
router.put("/:id", playerController.updatePlayer);
router.delete("/:id", playerController.deletePlayer);

export default router;
