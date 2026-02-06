import express from "express";
import * as gameController from "../controllers/gameController.js";
import {
  authenticateToken,
  optionalAuth,
  checkTimeControlPermission,
  checkGamePermissions,
} from "../middleware/auth.js";

const router = express.Router();

// Ruta pública - Solo stats es accesible sin autenticación
router.get("/:id/stats", optionalAuth, gameController.getGameStats);

// Rutas públicas
router.get("/", gameController.getGames);
router.get("/:id", gameController.getGame);
router.get(
  "/:id/stats/breakdown",
  authenticateToken,
  gameController.getGameStatsWithBreakdown
);
router.get(
  "/:id/active-players",
  authenticateToken,
  gameController.getActivePlayers
);
router.get("/:id/bench-players", authenticateToken, gameController.getBenchPlayers);
router.get(
  "/:id/bench-players/home",
  authenticateToken,
  gameController.getHomeBenchPlayers
);
router.get(
  "/:id/bench-players/away",
  authenticateToken,
  gameController.getAwayBenchPlayers
);

// Rutas de creación/edición básica (públicas)
router.post("/", gameController.createGame);
router.put("/:id", gameController.updateGame);
router.delete("/:id", gameController.deleteGame);
router.delete("/", authenticateToken, gameController.deleteAllGames);

// Rutas críticas de control de tiempo (requieren permisos específicos)
router.put(
  "/:id/time",
  authenticateToken,
  checkTimeControlPermission,
  gameController.updateGameTime
);
router.post(
  "/:id/reset-time",
  authenticateToken,
  checkTimeControlPermission,
  gameController.resetGameTime
);

// Rutas de sustituciones (requieren permisos específicos)
router.post(
  "/:id/substitution",
  authenticateToken,
  checkGamePermissions(["canMakeSubstitutions"]),
  gameController.makeSubstitution
);
router.post(
  "/:id/set-starters",
  authenticateToken,
  checkGamePermissions(["canSetStarters"]),
  gameController.setStartingPlayers
);
router.put(
  "/:id/active-players/home",
  authenticateToken,
  checkGamePermissions(["canMakeSubstitutions"]),
  gameController.updateHomeActivePlayers
);
router.put(
  "/:id/active-players/away",
  authenticateToken,
  checkGamePermissions(["canMakeSubstitutions"]),
  gameController.updateAwayActivePlayers
);

// Rutas de estadísticas (requieren permisos específicos según el tipo)
router.put(
  "/:id/score",
  authenticateToken,
  checkGamePermissions(["canEditPoints"]),
  gameController.updateScore
);
router.put(
  "/:id/full-update",
  authenticateToken,
  checkTimeControlPermission,
  gameController.fullUpdateGame
);
router.put(
  "/:id/player-stats",
  authenticateToken,
  checkGamePermissions(["canEditPoints", "canEditRebounds", "canEditAssists"]),
  gameController.updatePlayerStats
);
router.put(
  "/:id/player-minutes",
  authenticateToken,
  checkTimeControlPermission,
  gameController.updatePlayerMinutes
);
router.put(
  "/:id/player-plusminus",
  authenticateToken,
  checkTimeControlPermission,
  gameController.updatePlayerPlusMinus
);

// Rutas específicas de estadísticas (con permisos granulares)
router.post(
  "/:id/record-shot",
  authenticateToken,
  checkGamePermissions(["canEditShots"]),
  gameController.recordShot
);
router.post(
  "/:id/record-rebound",
  authenticateToken,
  checkGamePermissions(["canEditRebounds"]),
  gameController.recordRebound
);
router.post(
  "/:id/record-offensive-rebound",
  authenticateToken,
  checkGamePermissions(["canEditRebounds"]),
  gameController.recordOffensiveRebound
);
router.post("/:id/record-assist", gameController.recordAssist);
router.post("/:id/record-steal", gameController.recordSteal);
router.post("/:id/record-block", gameController.recordBlock);
router.post("/:id/record-turnover", gameController.recordTurnover);
router.post("/:id/record-personal-foul", gameController.recordPersonalFoul);
router.put("/:id/settings", gameController.updateGameSettings);
router.post("/:id/next-quarter", gameController.nextQuarter);
router.put("/:id/quarter-time", gameController.updateQuarterTime);
router.get("/:id/check-end", gameController.checkGameEnd);
router.post("/:id/start", gameController.startGame);

export default router;
