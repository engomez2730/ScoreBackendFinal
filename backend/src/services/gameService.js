import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getAllGames = async () => {
  return prisma.game.findMany({
    include: {
      event: true,
      teamHome: true,
      teamAway: true,
      stats: true,
      substitutions: true,
    },
  });
};

export const getGameById = async (id) => {
  return prisma.game.findUnique({
    where: { id: Number(id) },
    include: {
      event: true,
      teamHome: true,
      teamAway: true,
      stats: true,
      substitutions: true,
    },
  });
};

export const createGame = async (data) => {
  return prisma.game.create({ data });
};

export const updateGame = async (id, data) => {
  return prisma.game.update({ where: { id: Number(id) }, data });
};

export const deleteGame = async (id) => {
  return prisma.game.delete({ where: { id: Number(id) } });
};
