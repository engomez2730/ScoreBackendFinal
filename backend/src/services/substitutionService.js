import pkg from "@prisma/client";
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const getSubstitutionsByGame = async (gameId) => {
  return prisma.substitution.findMany({
    where: { gameId: Number(gameId) },
    include: { playerIn: true, playerOut: true },
  });
};

const getActivePlayersCount = async (gameId, teamId) => {
  const game = await prisma.game.findUnique({
    where: { id: Number(gameId) },
    include: {
      activePlayers: {
        where: { teamId: Number(teamId) }
      }
    }
  });
  return game.activePlayers.length;
};

const validatePlayerTeams = async (playerInId, playerOutId) => {
  const [playerIn, playerOut] = await Promise.all([
    prisma.player.findUnique({ where: { id: Number(playerInId) } }),
    prisma.player.findUnique({ where: { id: Number(playerOutId) } })
  ]);

  if (playerIn.teamId !== playerOut.teamId) {
    throw new Error("Los jugadores deben ser del mismo equipo");
  }
  return playerIn.teamId;
};

export const createSubstitution = async (gameId, playerInId, playerOutId, gameTime) => {
  return prisma.$transaction(async (tx) => {
    // Validate players are from the same team
    const teamId = await validatePlayerTeams(playerInId, playerOutId);
    
    // Get game and active players
    const game = await tx.game.findUnique({
      where: { id: Number(gameId) },
      include: {
        activePlayers: true
      }
    });

    if (!game) {
      throw new Error("Juego no encontrado");
    }

    if (game.estado !== 'in_progress') {
      throw new Error("Solo se pueden hacer sustituciones durante el juego");
    }

    // Verify playerOut is currently active
    const isPlayerOutActive = game.activePlayers.some(p => p.id === Number(playerOutId));
    if (!isPlayerOutActive) {
      throw new Error("El jugador a sustituir no está en la cancha");
    }

    // Verify playerIn is not already active
    const isPlayerInActive = game.activePlayers.some(p => p.id === Number(playerInId));
    if (isPlayerInActive) {
      throw new Error("El jugador entrante ya está en la cancha");
    }

    // Record the substitution
    const substitution = await tx.substitution.create({
      data: {
        gameId: Number(gameId),
        playerInId: Number(playerInId),
        playerOutId: Number(playerOutId),
        timestamp: new Date(),
        gameTime: Number(gameTime)
      }
    });

    // Update active players
    await tx.game.update({
      where: { id: Number(gameId) },
      data: {
        activePlayers: {
          disconnect: { id: Number(playerOutId) },
          connect: { id: Number(playerInId) }
        }
      }
    });

    // Get updated game state for verification
    const updatedGame = await tx.game.findUnique({
      where: { id: Number(gameId) },
      include: {
        activePlayers: {
          include: {
            team: true
          }
        }
      }
    });

    // Verify team still has exactly 5 players
    const teamActivePlayers = updatedGame.activePlayers.filter(p => p.teamId === teamId);
    if (teamActivePlayers.length !== 5) {
      throw new Error(`El equipo debe tener exactamente 5 jugadores en la cancha (actualmente tiene ${teamActivePlayers.length})`);
    }

    return {
      substitution,
      activePlayers: updatedGame.activePlayers
    };
  });
};
