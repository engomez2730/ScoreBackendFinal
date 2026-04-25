import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getAllTeams = async () => {
  return prisma.team.findMany({
    include: { players: true, homeGames: true, awayGames: true },
  });
};

export const getTeamById = async (id) => {
  return prisma.team.findUnique({
    where: { id: Number(id) },
    include: { players: true, homeGames: true, awayGames: true },
  });
};

export const createTeam = async (data) => {
  return prisma.team.create({ data });
};

export const updateTeam = async (id, data) => {
  return prisma.team.update({ where: { id: Number(id) }, data });
};

export const deleteTeam = async (id) => {
  return prisma.team.delete({ where: { id: Number(id) } });
};
