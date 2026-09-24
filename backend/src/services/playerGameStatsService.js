import prisma from "../lib/prisma.js";
import { syncEfficiency } from "../lib/efficiency.js";

export const getStatsByGame = async (gameId) => {
  return prisma.playerGameStats.findMany({
    where: { gameId: Number(gameId) },
    include: { player: true },
  });
};

export const getStatsByPlayer = async (playerId) => {
  return prisma.playerGameStats.findMany({
    where: { playerId: Number(playerId) },
    include: { game: true },
  });
};

export const createOrUpdateStats = async (gameId, playerId, data) => {
  const existing = await prisma.playerGameStats.findFirst({
    where: { gameId: Number(gameId), playerId: Number(playerId) },
  });
  // eficiencia is always derived, never taken from the client
  const { eficiencia, ...rest } = data;
  const saved = existing
    ? await prisma.playerGameStats.update({ where: { id: existing.id }, data: rest })
    : await prisma.playerGameStats.create({
        data: { ...rest, gameId: Number(gameId), playerId: Number(playerId) },
      });
  return syncEfficiency(prisma, saved);
};
