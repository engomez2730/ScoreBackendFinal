import express from "express";
import * as statsController from "../controllers/playerGameStatsController.js";

const router = express.Router();

// Obtener estadísticas de todos los jugadores de un juego
router.get("/game/:gameId", statsController.getStatsByGame);

// Obtener estadísticas de un jugador en todos los juegos
router.get("/player/:playerId", statsController.getStatsByPlayer);

// Crear o actualizar estadísticas de un jugador en un juego
router.post("/:gameId/:playerId", statsController.createOrUpdateStats);

export default router;
