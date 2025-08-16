import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getSubstitutionsByGame = async (gameId) => {
  return prisma.substitution.findMany({
    where: { gameId: Number(gameId) },
    include: { playerIn: true, playerOut: true },
  });
};

export const createSubstitution = async (data) => {
  return prisma.substitution.create({ data });
};
