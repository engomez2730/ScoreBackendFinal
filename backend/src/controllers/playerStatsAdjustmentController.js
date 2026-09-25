import * as adjustmentService from "../services/playerStatsAdjustmentService.js";
import { io } from "../index.js";

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const sendError = (res, error) => {
  if (error.status) {
    return res.status(error.status).json({ error: error.message, ...error.details });
  }
  console.error("Error en corrección manual de estadísticas:", error);
  res.status(500).json({ error: "Error interno del servidor" });
};

// Reuses the events clients already listen to, so the operator view and the
// public stats page refresh with no client changes: every "statsUpdated"
// listener refetches the game (stats and score). statType lets clients that
// care tell a manual correction apart from a live play. Emitted whatever the
// game state — for a finished game the room just holds people viewing it.
const emitAdjustment = (gameId, result, user) => {
  const room = `game_${gameId}`;
  const timestamp = new Date();
  io.to(room).emit("statsUpdated", {
    gameId,
    playerId: result.player.id,
    stats: result.stats,
    statType: "manualAdjustment",
    changedFields: result.changed,
    homeScore: result.game.homeScore,
    awayScore: result.game.awayScore,
    updatedBy: user.nombre,
    timestamp,
  });
  if (result.pointsDelta !== 0) {
    io.to(room).emit("scoreUpdated", {
      gameId,
      homeScore: result.game.homeScore,
      awayScore: result.game.awayScore,
      timestamp,
    });
  }
};

// PUT /api/games/:id/players/:playerId/stats
// body: { stats, baseline?, reason? } — see lib/manualStats.js for the fields
export const adjustPlayerStats = async (req, res) => {
  const gameId = parseId(req.params.id);
  const playerId = parseId(req.params.playerId);
  if (!gameId || !playerId) {
    return res.status(400).json({ error: "IDs de juego/jugador inválidos" });
  }

  const { stats, baseline, reason } = req.body ?? {};
  try {
    const result = await adjustmentService.adjustPlayerStats({
      gameId,
      playerId,
      stats,
      baseline,
      reason,
      userId: req.user.id,
    });
    if (result.game) emitAdjustment(gameId, result, req.user);
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
};

// GET /api/games/:id/stat-adjustments?playerId=
export const getAdjustmentHistory = async (req, res) => {
  const gameId = parseId(req.params.id);
  if (!gameId) return res.status(400).json({ error: "ID de juego inválido" });
  try {
    const history = await adjustmentService.getAdjustmentHistory(
      gameId,
      parseId(req.query.playerId)
    );
    res.json(history);
  } catch (error) {
    sendError(res, error);
  }
};
