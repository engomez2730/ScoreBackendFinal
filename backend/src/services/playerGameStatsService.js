import pkg from "@prisma/client";
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

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
  if (existing) {
    return prisma.playerGameStats.update({ where: { id: existing.id }, data });
  } else {
    return prisma.playerGameStats.create({
      data: { ...data, gameId: Number(gameId), playerId: Number(playerId) },
    });
  }
};
