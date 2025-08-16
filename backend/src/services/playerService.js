import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getAllPlayers = async () => {
  return prisma.player.findMany({
    include: {
      team: true,
      stats: true,
      substitutionsIn: true,
      substitutionsOut: true,
    },
  });
};

export const getPlayerById = async (id) => {
  return prisma.player.findUnique({
    where: { id: Number(id) },
    include: {
      team: true,
      stats: true,
      substitutionsIn: true,
      substitutionsOut: true,
    },
  });
};

export const createPlayer = async (data) => {
  return prisma.player.create({ data });
};

export const updatePlayer = async (id, data) => {
  return prisma.player.update({ where: { id: Number(id) }, data });
};

export const deletePlayer = async (id) => {
  return prisma.player.delete({ where: { id: Number(id) } });
};
