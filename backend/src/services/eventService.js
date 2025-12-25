import pkg from "@prisma/client";
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const getAllEvents = async () => {
  return prisma.event.findMany({ include: { games: true } });
};

export const getEventById = async (id) => {
  return prisma.event.findUnique({
    where: { id: Number(id) },
    include: { games: true },
  });
};

export const createEvent = async (data) => {
  return prisma.event.create({ data });
};

export const updateEvent = async (id, data) => {
  return prisma.event.update({ where: { id: Number(id) }, data });
};

export const deleteEvent = async (id) => {
  return prisma.event.delete({ where: { id: Number(id) } });
};
