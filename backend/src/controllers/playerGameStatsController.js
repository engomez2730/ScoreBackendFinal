import * as statsService from "../services/playerGameStatsService.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getStatsByGame = async (req, res) => {
  const stats = await statsService.getStatsByGame(req.params.gameId);
  res.json(stats);
};

export const getStatsByPlayer = async (req, res) => {
  const stats = await statsService.getStatsByPlayer(req.params.playerId);
  res.json(stats);
};

// Helper para saber si el jugador está en cancha
async function isPlayerOnCourt(gameId, playerId) {
  // Obtener todas las sustituciones ordenadas por timestamp
  const subs = await prisma.substitution.findMany({
    where: { gameId: Number(gameId) },
    orderBy: { timestamp: "asc" },
  });
  // Obtener el primer ingreso del jugador
  let onCourt = false;
  for (const sub of subs) {
    if (sub.playerInId === Number(playerId)) onCourt = true;
    if (sub.playerOutId === Number(playerId)) onCourt = false;
  }
  return onCourt;
}

export const createOrUpdateStats = async (req, res) => {
  const { gameId, playerId } = req.params;
  try {
    const onCourt = await isPlayerOnCourt(gameId, playerId);
    if (!onCourt) {
      return res
        .status(403)
        .json({
          error: "Solo puedes modificar estadísticas de jugadores en cancha.",
        });
    }
    const stats = await statsService.createOrUpdateStats(
      gameId,
      playerId,
      req.body
    );
    res.status(201).json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
