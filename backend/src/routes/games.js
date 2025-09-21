import express from "express";
import * as gameController from "../controllers/gameController.js";

const router = express.Router();

router.get("/", gameController.getGames);
router.get("/:id", gameController.getGame);
router.post("/", gameController.createGame);
router.put("/:id", gameController.updateGame);
router.delete("/:id", gameController.deleteGame);
router.delete("/", gameController.deleteAllGames);
router.put("/:id/time", gameController.updateGameTime);
router.post("/:id/reset-time", gameController.resetGameTime);
router.put("/:id/score", gameController.updateScore);
router.put("/:id/full-update", gameController.fullUpdateGame);
router.get("/:id/stats", gameController.getGameStats);
router.put("/:id/player-stats", gameController.updatePlayerStats);
router.put("/:id/player-minutes", gameController.updatePlayerMinutes);
router.put("/:id/player-plusminus", gameController.updatePlayerPlusMinus);
router.get("/:id/active-players", gameController.getActivePlayers);
router.get("/:id/bench-players", gameController.getBenchPlayers);
router.get("/:id/bench-players/home", gameController.getHomeBenchPlayers);
router.get("/:id/bench-players/away", gameController.getAwayBenchPlayers);
router.put("/:id/active-players/home", gameController.updateHomeActivePlayers);
router.put("/:id/active-players/away", gameController.updateAwayActivePlayers);
router.post("/:id/substitution", gameController.makeSubstitution);
router.post("/:id/record-shot", gameController.recordShot);
router.post("/:id/record-rebound", gameController.recordRebound);
router.post("/:id/record-assist", gameController.recordAssist);
router.post("/:id/record-steal", gameController.recordSteal);
router.post("/:id/record-block", gameController.recordBlock);
router.post("/:id/record-turnover", gameController.recordTurnover);
router.put("/:id/settings", gameController.updateGameSettings);
router.post("/:id/next-quarter", gameController.nextQuarter);
router.put("/:id/quarter-time", gameController.updateQuarterTime);
router.get("/:id/check-end", gameController.checkGameEnd);
router.post("/:id/start", gameController.startGame);

export default router;
