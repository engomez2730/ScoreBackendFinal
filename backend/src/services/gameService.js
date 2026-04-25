export const fullUpdateGame = async (
  gameId,
  { homeScore, awayScore, currentQuarter, quarterTime, gameTime, playerStats }
) => {
  return prisma.$transaction(async (tx) => {
    // Update game details
    const updatedGame = await tx.game.update({
      where: { id: Number(gameId) },
      data: {
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        currentQuarter: Number(currentQuarter),
        quarterTime: Number(quarterTime),
        gameTime: Number(gameTime),
      },
    });

    // Update player stats
    let updatedStats = [];
    if (Array.isArray(playerStats)) {
      for (const stat of playerStats) {
        const { playerId, ...rest } = stat;
        const updated = await tx.playerGameStats.upsert({
          where: {
            gameId_playerId: {
              gameId: Number(gameId),
              playerId: Number(playerId),
            },
          },
          update: rest,
          create: {
            gameId: Number(gameId),
            playerId: Number(playerId),
            ...rest,
          },
        });
        updatedStats.push(updated);
      }
    }

    return {
      game: updatedGame,
      playerStats: updatedStats,
    };
  });
};
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

export const checkTeamPlayers = async (teamId) => {
  const players = await prisma.player.count({
    where: { teamId: Number(teamId) },
  });
  return players >= 10;
};

export const updateGame = async (id, data) => {
  // If changing to in_progress, validate team players
  if (data.estado === "in_progress") {
    const game = await getGameById(id);
    const homeTeamValid = await checkTeamPlayers(game.teamHomeId);
    const awayTeamValid = await checkTeamPlayers(game.teamAwayId);

    if (!homeTeamValid || !awayTeamValid) {
      throw new Error(
        "Cada equipo debe tener al menos 10 jugadores para comenzar el juego"
      );
    }
  }

  return prisma.game.update({ where: { id: Number(id) }, data });
};

export const deleteGame = async (id) => {
  return prisma.game.delete({ where: { id: Number(id) } });
};

export const deleteAllGames = async () => {
  return prisma.game.deleteMany({});
};

export const updateGameTime = async (id, gameTime) => {
  return prisma.game.update({
    where: { id: Number(id) },
    data: { gameTime: Number(gameTime) },
  });
};

export const setStartingPlayers = async (
  gameId,
  homeStarters,
  awayStarters
) => {
  return prisma.$transaction(async (tx) => {
    const game = await tx.game.findUnique({
      where: { id: Number(gameId) },
      include: {
        teamHome: {
          include: { players: true },
        },
        teamAway: {
          include: { players: true },
        },
        activePlayers: true,
      },
    });

    if (!game) {
      throw new Error("Juego no encontrado");
    }

    // Validate the number of starters
    if (homeStarters.length !== 5 || awayStarters.length !== 5) {
      throw new Error(
        "Cada equipo debe tener exactamente 5 jugadores titulares"
      );
    }

    // Verify all home starters exist and belong to home team
    const homeStarterPlayers = await tx.player.findMany({
      where: {
        id: { in: homeStarters.map((id) => Number(id)) },
        teamId: game.teamHomeId,
      },
    });

    if (homeStarterPlayers.length !== 5) {
      throw new Error(
        "Uno o más jugadores titulares del equipo local no existen o no pertenecen al equipo"
      );
    }

    // Verify all away starters exist and belong to away team
    const awayStarterPlayers = await tx.player.findMany({
      where: {
        id: { in: awayStarters.map((id) => Number(id)) },
        teamId: game.teamAwayId,
      },
    });

    if (awayStarterPlayers.length !== 5) {
      throw new Error(
        "Uno o más jugadores titulares del equipo visitante no existen o no pertenecen al equipo"
      );
    }

    // Combine all starters
    const allStarters = [...homeStarters, ...awayStarters].map((id) =>
      Number(id)
    );

    // Update active players
    const updatedGame = await tx.game.update({
      where: { id: Number(gameId) },
      data: {
        activePlayers: {
          set: allStarters.map((id) => ({ id })),
        },
      },
      include: {
        activePlayers: {
          include: {
            team: true,
          },
        },
        teamHome: true,
        teamAway: true,
      },
    });

    // Mark starters in PlayerGameStats
    for (const starterId of allStarters) {
      await tx.playerGameStats.upsert({
        where: {
          gameId_playerId: {
            gameId: Number(gameId),
            playerId: starterId,
          },
        },
        update: {
          isStarter: true,
        },
        create: {
          gameId: Number(gameId),
          playerId: starterId,
          puntos: 0,
          rebotes: 0,
          asistencias: 0,
          robos: 0,
          tapones: 0,
          tirosIntentados: 0,
          tirosAnotados: 0,
          tiros3Intentados: 0,
          tiros3Anotados: 0,
          tirosLibresIntentados: 0,
          tirosLibresAnotados: 0,
          minutos: 0,
          plusMinus: 0,
          perdidas: 0,
          isStarter: true,
          puntosQ1: 0,
          puntosQ2: 0,
          puntosQ3: 0,
          puntosQ4: 0,
          puntosOT: 0,
        },
      });
    }

    // Organize players by team for the response
    const homePlayers = updatedGame.activePlayers.filter(
      (p) => p.teamId === updatedGame.teamHomeId
    );
    const awayPlayers = updatedGame.activePlayers.filter(
      (p) => p.teamId === updatedGame.teamAwayId
    );

    return {
      homeTeam: {
        id: updatedGame.teamHomeId,
        name: updatedGame.teamHome.nombre,
        starters: homePlayers.map((player) => ({
          id: player.id,
          nombre: player.nombre,
          apellido: player.apellido,
          numero: player.numero,
          posicion: player.posicion,
        })),
      },
      awayTeam: {
        id: updatedGame.teamAwayId,
        name: updatedGame.teamAway.nombre,
        starters: awayPlayers.map((player) => ({
          id: player.id,
          nombre: player.nombre,
          apellido: player.apellido,
          numero: player.numero,
          posicion: player.posicion,
        })),
      },
    };
  });
};

export const updateScore = async (id, homeScore, awayScore) => {
  return prisma.game.update({
    where: { id: Number(id) },
    data: {
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
    },
  });
};

export const updatePlayerStats = async (gameId, playerId, stats) => {
  return prisma.playerGameStats.upsert({
    where: {
      gameId_playerId: {
        gameId: Number(gameId),
        playerId: Number(playerId),
      },
    },
    update: stats,
    create: {
      gameId: Number(gameId),
      playerId: Number(playerId),
      ...stats,
    },
  });
};

export const updatePlayerMinutes = async (gameId, playerMinutes) => {
  return prisma.$transaction(async (tx) => {
    const updatedStats = [];

    // Convert minutes from milliseconds to seconds for storage
    for (const [playerId, minutesInMs] of Object.entries(playerMinutes)) {
      const minutesInSeconds = Math.floor(Number(minutesInMs) / 1000);

      // Use upsert to safely update only minutes, preserving other stats
      const updated = await tx.playerGameStats.upsert({
        where: {
          gameId_playerId: {
            gameId: Number(gameId),
            playerId: Number(playerId),
          },
        },
        update: {
          minutos: minutesInSeconds,
        },
        create: {
          gameId: Number(gameId),
          playerId: Number(playerId),
          puntos: 0,
          rebotes: 0,
          asistencias: 0,
          robos: 0,
          tapones: 0,
          tirosIntentados: 0,
          tirosAnotados: 0,
          tiros3Intentados: 0,
          tiros3Anotados: 0,
          tirosLibresIntentados: 0,
          tirosLibresAnotados: 0,
          minutos: minutesInSeconds,
          plusMinus: 0,
          perdidas: 0,
        },
      });

      updatedStats.push(updated);
    }

    return {
      message: `Updated minutes for ${updatedStats.length} players`,
      updatedStats,
    };
  });
};

export const updatePlayerPlusMinus = async (gameId, playerPlusMinus) => {
  return prisma.$transaction(async (tx) => {
    const updatedStats = [];

    for (const [playerId, plusMinusValue] of Object.entries(playerPlusMinus)) {
      // Use upsert to safely update only plusMinus, preserving other stats
      const updated = await tx.playerGameStats.upsert({
        where: {
          gameId_playerId: {
            gameId: Number(gameId),
            playerId: Number(playerId),
          },
        },
        update: {
          plusMinus: Number(plusMinusValue),
        },
        create: {
          gameId: Number(gameId),
          playerId: Number(playerId),
          puntos: 0,
          rebotes: 0,
          asistencias: 0,
          robos: 0,
          tapones: 0,
          tirosIntentados: 0,
          tirosAnotados: 0,
          tiros3Intentados: 0,
          tiros3Anotados: 0,
          tirosLibresIntentados: 0,
          tirosLibresAnotados: 0,
          minutos: 0,
          plusMinus: Number(plusMinusValue),
          perdidas: 0,
        },
      });

      updatedStats.push(updated);
    }

    return {
      message: `Updated plus/minus for ${updatedStats.length} players`,
      updatedStats,
    };
  });
};

export const getGameStats = async (id) => {
  return prisma.playerGameStats.findMany({
    where: { gameId: Number(id) },
    include: {
      player: true,
    },
  });
};

export const getGameStatsWithBreakdown = async (id) => {
  const stats = await prisma.playerGameStats.findMany({
    where: { gameId: Number(id) },
    include: {
      player: {
        include: {
          team: true
        }
      }
    }
  });

  // Separate starters and bench players
  const starters = stats.filter(stat => stat.isStarter);
  const bench = stats.filter(stat => !stat.isStarter);

  // Calculate team totals
  const starterStats = {
    totalPoints: starters.reduce((sum, s) => sum + s.puntos, 0),
    pointsQ1: starters.reduce((sum, s) => sum + s.puntosQ1, 0),
    pointsQ2: starters.reduce((sum, s) => sum + s.puntosQ2, 0),
    pointsQ3: starters.reduce((sum, s) => sum + s.puntosQ3, 0),
    pointsQ4: starters.reduce((sum, s) => sum + s.puntosQ4, 0),
    pointsOT: starters.reduce((sum, s) => sum + s.puntosOT, 0),
    rebounds: starters.reduce((sum, s) => sum + s.rebotes, 0),
    assists: starters.reduce((sum, s) => sum + s.asistencias, 0),
    steals: starters.reduce((sum, s) => sum + s.robos, 0),
    blocks: starters.reduce((sum, s) => sum + s.tapones, 0),
    turnovers: starters.reduce((sum, s) => sum + s.perdidas, 0),
    personalFouls: starters.reduce((sum, s) => sum + s.faltasPersonales, 0),
    foulsQ1: starters.reduce((sum, s) => sum + s.faltasQ1, 0),
    foulsQ2: starters.reduce((sum, s) => sum + s.faltasQ2, 0),
    foulsQ3: starters.reduce((sum, s) => sum + s.faltasQ3, 0),
    foulsQ4: starters.reduce((sum, s) => sum + s.faltasQ4, 0),
    foulsOT: starters.reduce((sum, s) => sum + s.faltasOT, 0),
    players: starters
  };

  const benchStats = {
    totalPoints: bench.reduce((sum, s) => sum + s.puntos, 0),
    pointsQ1: bench.reduce((sum, s) => sum + s.puntosQ1, 0),
    pointsQ2: bench.reduce((sum, s) => sum + s.puntosQ2, 0),
    pointsQ3: bench.reduce((sum, s) => sum + s.puntosQ3, 0),
    pointsQ4: bench.reduce((sum, s) => sum + s.puntosQ4, 0),
    pointsOT: bench.reduce((sum, s) => sum + s.puntosOT, 0),
    rebounds: bench.reduce((sum, s) => sum + s.rebotes, 0),
    assists: bench.reduce((sum, s) => sum + s.asistencias, 0),
    steals: bench.reduce((sum, s) => sum + s.robos, 0),
    blocks: bench.reduce((sum, s) => sum + s.tapones, 0),
    turnovers: bench.reduce((sum, s) => sum + s.perdidas, 0),
    personalFouls: bench.reduce((sum, s) => sum + s.faltasPersonales, 0),
    foulsQ1: bench.reduce((sum, s) => sum + s.faltasQ1, 0),
    foulsQ2: bench.reduce((sum, s) => sum + s.faltasQ2, 0),
    foulsQ3: bench.reduce((sum, s) => sum + s.faltasQ3, 0),
    foulsQ4: bench.reduce((sum, s) => sum + s.faltasQ4, 0),
    foulsOT: bench.reduce((sum, s) => sum + s.faltasOT, 0),
    players: bench
  };

  return {
    starters: starterStats,
    bench: benchStats,
    quarterBreakdown: {
      q1: starterStats.pointsQ1 + benchStats.pointsQ1,
      q2: starterStats.pointsQ2 + benchStats.pointsQ2,
      q3: starterStats.pointsQ3 + benchStats.pointsQ3,
      q4: starterStats.pointsQ4 + benchStats.pointsQ4,
      ot: starterStats.pointsOT + benchStats.pointsOT
    },
    foulsBreakdown: {
      q1: starterStats.foulsQ1 + benchStats.foulsQ1,
      q2: starterStats.foulsQ2 + benchStats.foulsQ2,
      q3: starterStats.foulsQ3 + benchStats.foulsQ3,
      q4: starterStats.foulsQ4 + benchStats.foulsQ4,
      ot: starterStats.foulsOT + benchStats.foulsOT,
      total: starterStats.personalFouls + benchStats.personalFouls
    },
    allPlayers: stats
  };
};

export const getActivePlayers = async (id) => {
  const game = await prisma.game.findUnique({
    where: { id: Number(id) },
    include: {
      activePlayers: {
        include: {
          team: true, // Include team information for each player
        },
      },
      teamHome: true,
      teamAway: true,
    },
  });

  if (!game) {
    throw new Error("Juego no encontrado");
  }

  // Separate players by team
  const homePlayers = game.activePlayers.filter(
    (player) => player.teamId === game.teamHomeId
  );
  const awayPlayers = game.activePlayers.filter(
    (player) => player.teamId === game.teamAwayId
  );

  return {
    homeTeam: {
      name: game.teamHome.nombre,
      players: homePlayers,
    },
    awayTeam: {
      name: game.teamAway.nombre,
      players: awayPlayers,
    },
  };
};

export const updateTeamActivePlayers = async (id, playerIds, teamType) => {
  return prisma.$transaction(async (tx) => {
    // Get the game and current active players
    const game = await tx.game.findUnique({
      where: { id: Number(id) },
      include: {
        teamHome: true,
        teamAway: true,
        activePlayers: true,
      },
    });

    if (!game) {
      throw new Error("Juego no encontrado");
    }

    // Get all players to be set as active
    const players = await tx.player.findMany({
      where: {
        id: {
          in: playerIds.map((id) => Number(id)),
        },
      },
    });

    // Validate all players exist
    if (players.length !== playerIds.length) {
      throw new Error("Uno o más jugadores no existen");
    }

    // Validate players belong to the correct team
    const expectedTeamId =
      teamType === "home" ? game.teamHomeId : game.teamAwayId;
    const invalidPlayers = players.filter((p) => p.teamId !== expectedTeamId);
    if (invalidPlayers.length > 0) {
      throw new Error("Uno o más jugadores no pertenecen al equipo correcto");
    }

    // Get current active players from the other team
    const otherTeamId = teamType === "home" ? game.teamAwayId : game.teamHomeId;
    const otherTeamPlayers = game.activePlayers.filter(
      (p) => p.teamId === otherTeamId
    );

    // Prepare the complete list of active players (new team players + other team's existing players)
    const allActivePlayerIds = [
      ...playerIds,
      ...otherTeamPlayers.map((p) => p.id),
    ];

    // Update active players
    const updatedGame = await tx.game.update({
      where: { id: Number(id) },
      data: {
        activePlayers: {
          set: allActivePlayerIds.map((id) => ({ id: Number(id) })),
        },
      },
      include: {
        activePlayers: {
          include: {
            team: true,
          },
        },
        teamHome: true,
        teamAway: true,
      },
    });

    // Organize players by team for the response
    const homePlayers = updatedGame.activePlayers.filter(
      (p) => p.teamId === updatedGame.teamHomeId
    );
    const awayPlayers = updatedGame.activePlayers.filter(
      (p) => p.teamId === updatedGame.teamAwayId
    );

    return {
      homeTeam: {
        id: updatedGame.teamHomeId,
        name: updatedGame.teamHome.nombre,
        players: homePlayers,
      },
      awayTeam: {
        id: updatedGame.teamAwayId,
        name: updatedGame.teamAway.nombre,
        players: awayPlayers,
      },
    };
  });
};

export const getBenchPlayers = async (gameId) => {
  const game = await prisma.game.findUnique({
    where: { id: Number(gameId) },
    include: {
      teamHome: {
        include: {
          players: true,
        },
      },
      teamAway: {
        include: {
          players: true,
        },
      },
      activePlayers: true,
    },
  });

  if (!game) {
    throw new Error("Juego no encontrado");
  }

  // Get all players from both teams
  const homePlayers = game.teamHome.players;
  const awayPlayers = game.teamAway.players;

  // Get active player IDs
  const activePlayerIds = new Set(game.activePlayers.map((p) => p.id));

  // Filter out active players to get bench players
  const homeBench = homePlayers.filter((p) => !activePlayerIds.has(p.id));
  const awayBench = awayPlayers.filter((p) => !activePlayerIds.has(p.id));

  return {
    homeTeam: {
      id: game.teamHomeId,
      name: game.teamHome.nombre,
      benchPlayers: homeBench,
    },
    awayTeam: {
      id: game.teamAwayId,
      name: game.teamAway.nombre,
      benchPlayers: awayBench,
    },
  };
};

export const getTeamBenchPlayers = async (gameId, teamType) => {
  const game = await prisma.game.findUnique({
    where: { id: Number(gameId) },
    include: {
      teamHome: {
        include: {
          players: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              numero: true,
              posicion: true,
            },
          },
        },
      },
      teamAway: {
        include: {
          players: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              numero: true,
              posicion: true,
            },
          },
        },
      },
      activePlayers: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!game) {
    throw new Error("Juego no encontrado");
  }

  // Get active player IDs
  const activePlayerIds = new Set(game.activePlayers.map((p) => p.id));

  // Get the requested team's players
  const team = teamType === "home" ? game.teamHome : game.teamAway;
  const benchPlayers = team.players.filter((p) => !activePlayerIds.has(p.id));

  return {
    teamId: team.id,
    teamName: team.nombre,
    benchPlayers: benchPlayers.map((player) => ({
      id: player.id,
      nombre: player.nombre,
      apellido: player.apellido,
      numero: player.numero,
      posicion: player.posicion,
    })),
  };
};

export const makeSubstitution = async (
  gameId,
  playerOutId,
  playerInId,
  gameTime,
  expectedTeamId = null
) => {
  return prisma.$transaction(async (tx) => {
    const game = await tx.game.findUnique({
      where: { id: Number(gameId) },
      include: {
        activePlayers: true,
        teamHome: true,
        teamAway: true,
      },
    });

    if (!game) {
      throw new Error("Juego no encontrado");
    }

    // Verify both players exist and get their details
    const [playerOut, playerIn] = await Promise.all([
      tx.player.findUnique({ where: { id: Number(playerOutId) } }),
      tx.player.findUnique({ where: { id: Number(playerInId) } }),
    ]);

    if (!playerOut || !playerIn) {
      throw new Error("Uno o ambos jugadores no existen");
    }

    // Verify players are from the same team
    if (playerOut.teamId !== playerIn.teamId) {
      throw new Error("Los jugadores deben ser del mismo equipo");
    }

    // Additional team validation if expectedTeamId is provided
    if (expectedTeamId !== null) {
      if (
        playerOut.teamId !== expectedTeamId ||
        playerIn.teamId !== expectedTeamId
      ) {
        throw new Error(
          "Los jugadores deben pertenecer al equipo especificado"
        );
      }
    }

    // Verify playerOut is active and playerIn is on bench
    const isPlayerOutActive = game.activePlayers.some(
      (p) => p.id === Number(playerOutId)
    );
    const isPlayerInActive = game.activePlayers.some(
      (p) => p.id === Number(playerInId)
    );

    if (!isPlayerOutActive) {
      throw new Error("El jugador que sale no está en la cancha");
    }

    if (isPlayerInActive) {
      throw new Error("El jugador que entra ya está en la cancha");
    }

    // Record substitution
    const substitution = await tx.substitution.create({
      data: {
        gameId: Number(gameId),
        playerOutId: Number(playerOutId),
        playerInId: Number(playerInId),
        timestamp: new Date(),
        gameTime: Number(gameTime),
      },
    });

    // Update active players
    const updatedGame = await tx.game.update({
      where: { id: Number(gameId) },
      data: {
        activePlayers: {
          disconnect: { id: Number(playerOutId) },
          connect: { id: Number(playerInId) },
        },
      },
      include: {
        activePlayers: {
          include: {
            team: true,
          },
        },
      },
    });

    return {
      substitution,
      activePlayers: updatedGame.activePlayers,
      message: `Sustitución exitosa: ${playerIn.nombre} ${playerIn.apellido} entra por ${playerOut.nombre} ${playerOut.apellido}`,
    };
  });
};

export const recordShot = async (
  gameId,
  playerId,
  shotType,
  made,
  gameTime,
  playerMinutes
) => {
  return prisma.$transaction(async (tx) => {
    // Get game with active players to validate
    const game = await tx.game.findUnique({
      where: { id: Number(gameId) },
      include: {
        activePlayers: true,
      },
    });

    if (!game) {
      throw new Error("Juego no encontrado");
    }

    // Check if game is running (estado should be 'in_progress' and time should be running)
    if (game.estado !== "in_progress") {
      throw new Error(
        "No se pueden registrar estadísticas cuando el juego no está en progreso"
      );
    }

    // Check if player is on the court (in active players)
    const isPlayerActive = game.activePlayers.some(
      (p) => p.id === Number(playerId)
    );

    if (!isPlayerActive) {
      throw new Error(
        "No se pueden registrar estadísticas para jugadores que están en el banquillo"
      );
    }

    // Update game time first
    await tx.game.update({
      where: { id: Number(gameId) },
      data: { gameTime: Number(gameTime) },
    });

    // Calculate points based on shot type and determine quarter points
    let points = 0;
    let updateData = {};
    let createData = {
      gameId: Number(gameId),
      playerId: Number(playerId),
      puntos: 0,
      rebotes: 0,
      asistencias: 0,
      robos: 0,
      tapones: 0,
      tirosIntentados: 0,
      tirosAnotados: 0,
      tiros3Intentados: 0,
      tiros3Anotados: 0,
      tirosLibresIntentados: 0,
      tirosLibresAnotados: 0,
      perdidas: 0,
      minutos: 0,
      plusMinus: 0,
      isStarter: false, // Default to bench player
      puntosQ1: 0,
      puntosQ2: 0,
      puntosQ3: 0,
      puntosQ4: 0,
      puntosOT: 0,
    };

    // Determine which quarter we're in for points tracking
    let quarterPointsField = '';
    if (game.isOvertime) {
      quarterPointsField = 'puntosOT';
    } else {
      switch (game.currentQuarter) {
        case 1: quarterPointsField = 'puntosQ1'; break;
        case 2: quarterPointsField = 'puntosQ2'; break;
        case 3: quarterPointsField = 'puntosQ3'; break;
        case 4: quarterPointsField = 'puntosQ4'; break;
        default: quarterPointsField = 'puntosOT'; break;
      }
    }

    if (shotType === "2pt" || shotType === "field_goal") {
      // 2-point field goal
      points = made ? 2 : 0;
      updateData = {
        puntos: { increment: points },
        tirosIntentados: { increment: 1 }, // Field goal attempt
        tirosAnotados: { increment: made ? 1 : 0 }, // Field goal made
        [quarterPointsField]: { increment: points }, // Add points to current quarter
      };
      createData.puntos = points;
      createData.tirosIntentados = 1;
      createData.tirosAnotados = made ? 1 : 0;
      createData[quarterPointsField] = points;
    } else if (shotType === "3pt" || shotType === "three_point") {
      // 3-point field goal (counts as both field goal AND 3-pointer)
      points = made ? 3 : 0;
      updateData = {
        puntos: { increment: points },
        // Field goal stats (3-pointers count as field goals)
        tirosIntentados: { increment: 1 },
        tirosAnotados: { increment: made ? 1 : 0 },
        // 3-point specific stats
        tiros3Intentados: { increment: 1 },
        tiros3Anotados: { increment: made ? 1 : 0 },
        [quarterPointsField]: { increment: points }, // Add points to current quarter
      };
      createData.puntos = points;
      createData.tirosIntentados = 1;
      createData.tirosAnotados = made ? 1 : 0;
      createData.tiros3Intentados = 1;
      createData.tiros3Anotados = made ? 1 : 0;
      createData[quarterPointsField] = points;
    } else if (shotType === "ft" || shotType === "free_throw") {
      // Free throw (doesn't count as field goal)
      points = made ? 1 : 0;
      updateData = {
        puntos: { increment: points },
        tirosLibresIntentados: { increment: 1 },
        tirosLibresAnotados: { increment: made ? 1 : 0 },
        [quarterPointsField]: { increment: points }, // Add points to current quarter
        // Note: Free throws don't count as field goal attempts
      };
      createData.puntos = points;
      createData.tirosLibresIntentados = 1;
      createData.tirosLibresAnotados = made ? 1 : 0;
    }

    // Use upsert to either create or update, preserving existing values
    const updatedPlayerStats = await tx.playerGameStats.upsert({
      where: {
        gameId_playerId: {
          gameId: Number(gameId),
          playerId: Number(playerId),
        },
      },
      update: updateData,
      create: createData,
    });

    // Update game score if shot was made
    let updatedGame = null;
    if (made && points > 0) {
      const gameWithTeams = await tx.game.findUnique({
        where: { id: Number(gameId) },
        include: {
          teamHome: { include: { players: true } },
          teamAway: { include: { players: true } },
          activePlayers: true
        },
      });

      // Determine which team scored
      const isHomeTeam = gameWithTeams.teamHome.players.some(
        (p) => p.id === Number(playerId)
      );

      updatedGame = await tx.game.update({
        where: { id: Number(gameId) },
        data: {
          homeScore: isHomeTeam ? gameWithTeams.homeScore + points : gameWithTeams.homeScore,
          awayScore: !isHomeTeam ? gameWithTeams.awayScore + points : gameWithTeams.awayScore,
        },
        include: {
          teamHome: true,
          teamAway: true,
        },
      });

      // Update plus/minus for all players currently on court
      console.log('Updating plus/minus for active players:', gameWithTeams.activePlayers.length);
      
      for (const courtPlayer of gameWithTeams.activePlayers) {
        // If player is on the same team as the shooter, they get +points
        // If player is on the opposing team, they get -points
        const shooterTeamId = isHomeTeam ? gameWithTeams.teamHomeId : gameWithTeams.teamAwayId;
        const isSameTeam = courtPlayer.teamId === shooterTeamId;
        const plusMinusChange = isSameTeam ? points : -points;

        console.log(`Player ${courtPlayer.id}: ${isSameTeam ? 'same team' : 'opposing team'}, plusMinus change: ${plusMinusChange}`);

        // Update the player's plus/minus
        await tx.playerGameStats.upsert({
          where: {
            gameId_playerId: {
              gameId: Number(gameId),
              playerId: courtPlayer.id,
            },
          },
          update: {
            plusMinus: { increment: plusMinusChange },
          },
          create: {
            gameId: Number(gameId),
            playerId: courtPlayer.id,
            puntos: 0,
            rebotes: 0,
            asistencias: 0,
            robos: 0,
            tapones: 0,
            tirosIntentados: 0,
            tirosAnotados: 0,
            tiros3Intentados: 0,
            tiros3Anotados: 0,
            tirosLibresIntentados: 0,
            tirosLibresAnotados: 0,
            minutos: 0,
            plusMinus: plusMinusChange,
            perdidas: 0,
          },
        });
      }
    }

    // Get player info for response
    const player = await tx.player.findUnique({
      where: { id: Number(playerId) },
      include: { team: true },
    });

    return {
      success: true,
      shot: {
        player: {
          id: player.id,
          name: `${player.nombre} ${player.apellido}`,
          number: player.numero,
          team: player.team.nombre,
        },
        shotType: shotType,
        made: made,
        points: points,
        description: getShotDescription(shotType, made, points),
      },
      playerStats: updatedPlayerStats,
      gameScore: updatedGame
        ? {
            homeScore: updatedGame.homeScore,
            awayScore: updatedGame.awayScore,
            homeTeam: updatedGame.teamHome.nombre,
            awayTeam: updatedGame.teamAway.nombre,
          }
        : null,
    };
  });
};

// Helper function to create descriptive shot messages
const getShotDescription = (shotType, made, points) => {
  const result = made ? "MADE" : "MISSED";

  switch (shotType) {
    case "2pt":
    case "field_goal":
      return `${result} 2-point field goal${
        made ? ` (+${points} points)` : ""
      }`;
    case "3pt":
    case "three_point":
      return `${result} 3-point field goal${
        made ? ` (+${points} points)` : ""
      }`;
    case "ft":
    case "free_throw":
      return `${result} free throw${made ? ` (+${points} point)` : ""}`;
    default:
      return `${result} shot${made ? ` (+${points} points)` : ""}`;
  }
};

export const recordRebound = async (gameId, playerId) => {
  // Get game with active players to validate
  const game = await prisma.game.findUnique({
    where: { id: Number(gameId) },
    include: {
      activePlayers: true,
    },
  });

  if (!game) {
    throw new Error("Juego no encontrado");
  }

  // Check if game is running (estado should be 'in_progress')
  if (game.estado !== "in_progress") {
    throw new Error(
      "No se pueden registrar estadísticas cuando el juego no está en progreso"
    );
  }

  // Check if player is on the court (in active players)
  const isPlayerActive = game.activePlayers.some(
    (p) => p.id === Number(playerId)
  );

  if (!isPlayerActive) {
    throw new Error(
      "No se pueden registrar estadísticas para jugadores que están en el banquillo"
    );
  }

  // Use upsert to either create or update, preserving existing values
  return prisma.playerGameStats.upsert({
    where: {
      gameId_playerId: {
        gameId: Number(gameId),
        playerId: Number(playerId),
      },
    },
    update: {
      rebotes: { increment: 1 },
    },
    create: {
      gameId: Number(gameId),
      playerId: Number(playerId),
      puntos: 0,
      rebotes: 1,
      asistencias: 0,
      robos: 0,
      tapones: 0,
      tirosIntentados: 0,
      tirosAnotados: 0,
      tiros3Intentados: 0,
      tiros3Anotados: 0,
      tirosLibresIntentados: 0,
      tirosLibresAnotados: 0,
      perdidas: 0,
      faltasPersonales: 0,
      faltasQ1: 0,
      faltasQ2: 0,
      faltasQ3: 0,
      faltasQ4: 0,
      faltasOT: 0,
      minutos: 0,
      plusMinus: 0,
      isStarter: false,
      puntosQ1: 0,
      puntosQ2: 0,
      puntosQ3: 0,
      puntosQ4: 0,
      puntosOT: 0,
    },
  });
};

export const recordAssist = async (gameId, playerId) => {
  // Validate that the game exists and is currently running
  const game = await prisma.game.findUnique({
    where: { id: Number(gameId) },
    include: {
      activePlayers: true,
    },
  });

  if (!game) {
    throw new Error("Partido no encontrado");
  }

  if (game.estado !== "in_progress") {
    throw new Error(
      "No se pueden registrar estadísticas cuando el juego no está en progreso"
    );
  }

  // Validate that the player is currently active (not on bench)
  const isPlayerActive = game.activePlayers.some(
    (p) => p.id === Number(playerId)
  );

  if (!isPlayerActive) {
    throw new Error(
      "No se pueden registrar estadísticas para jugadores que están en el banquillo"
    );
  }

  // Use upsert to either create or update, preserving existing values
  return prisma.playerGameStats.upsert({
    where: {
      gameId_playerId: {
        gameId: Number(gameId),
        playerId: Number(playerId),
      },
    },
    update: {
      asistencias: { increment: 1 },
    },
    create: {
      gameId: Number(gameId),
      playerId: Number(playerId),
      puntos: 0,
      rebotes: 0,
      asistencias: 1,
      robos: 0,
      tapones: 0,
      tirosIntentados: 0,
      tirosAnotados: 0,
      tiros3Intentados: 0,
      tiros3Anotados: 0,
      tirosLibresIntentados: 0,
      tirosLibresAnotados: 0,
      perdidas: 0,
      faltasPersonales: 0,
      faltasQ1: 0,
      faltasQ2: 0,
      faltasQ3: 0,
      faltasQ4: 0,
      faltasOT: 0,
      minutos: 0,
      plusMinus: 0,
      isStarter: false,
      puntosQ1: 0,
      puntosQ2: 0,
      puntosQ3: 0,
      puntosQ4: 0,
      puntosOT: 0,
    },
  });
};

export const recordSteal = async (gameId, playerId) => {
  // Validate that the game exists and is currently running
  const game = await prisma.game.findUnique({
    where: { id: Number(gameId) },
    include: {
      activePlayers: true,
    },
  });

  if (!game) {
    throw new Error("Partido no encontrado");
  }

  if (game.estado !== "in_progress") {
    throw new Error(
      "No se pueden registrar estadísticas cuando el juego no está en progreso"
    );
  }

  // Validate that the player is currently active (not on bench)
  const isPlayerActive = game.activePlayers.some(
    (p) => p.id === Number(playerId)
  );

  if (!isPlayerActive) {
    throw new Error(
      "No se pueden registrar estadísticas para jugadores que están en el banquillo"
    );
  }

  // Use upsert to either create or update, preserving existing values
  return prisma.playerGameStats.upsert({
    where: {
      gameId_playerId: {
        gameId: Number(gameId),
        playerId: Number(playerId),
      },
    },
    update: {
      robos: { increment: 1 },
    },
    create: {
      gameId: Number(gameId),
      playerId: Number(playerId),
      puntos: 0,
      rebotes: 0,
      asistencias: 0,
      robos: 1,
      tapones: 0,
      tirosIntentados: 0,
      tirosAnotados: 0,
      tiros3Intentados: 0,
      tiros3Anotados: 0,
      tirosLibresIntentados: 0,
      tirosLibresAnotados: 0,
      perdidas: 0,
      faltasPersonales: 0,
      faltasQ1: 0,
      faltasQ2: 0,
      faltasQ3: 0,
      faltasQ4: 0,
      faltasOT: 0,
      minutos: 0,
      plusMinus: 0,
      isStarter: false,
      puntosQ1: 0,
      puntosQ2: 0,
      puntosQ3: 0,
      puntosQ4: 0,
      puntosOT: 0,
    },
  });
};

export const recordBlock = async (gameId, playerId) => {
  // Validate that the game exists and is currently running
  const game = await prisma.game.findUnique({
    where: { id: Number(gameId) },
    include: {
      activePlayers: true,
    },
  });

  if (!game) {
    throw new Error("Partido no encontrado");
  }

  if (game.estado !== "in_progress") {
    throw new Error(
      "No se pueden registrar estadísticas cuando el juego no está en progreso"
    );
  }

  // Validate that the player is currently active (not on bench)
  const isPlayerActive = game.activePlayers.some(
    (p) => p.id === Number(playerId)
  );

  if (!isPlayerActive) {
    throw new Error(
      "No se pueden registrar estadísticas para jugadores que están en el banquillo"
    );
  }

  // Use upsert to either create or update, preserving existing values
  return prisma.playerGameStats.upsert({
    where: {
      gameId_playerId: {
        gameId: Number(gameId),
        playerId: Number(playerId),
      },
    },
    update: {
      tapones: { increment: 1 },
    },
    create: {
      gameId: Number(gameId),
      playerId: Number(playerId),
      puntos: 0,
      rebotes: 0,
      asistencias: 0,
      robos: 0,
      tapones: 1,
      tirosIntentados: 0,
      tirosAnotados: 0,
      tiros3Intentados: 0,
      tiros3Anotados: 0,
      tirosLibresIntentados: 0,
      tirosLibresAnotados: 0,
      perdidas: 0,
      faltasPersonales: 0,
      faltasQ1: 0,
      faltasQ2: 0,
      faltasQ3: 0,
      faltasQ4: 0,
      faltasOT: 0,
      minutos: 0,
      plusMinus: 0,
      isStarter: false,
      puntosQ1: 0,
      puntosQ2: 0,
      puntosQ3: 0,
      puntosQ4: 0,
      puntosOT: 0,
    },
  });
};

export const updateGameSettings = async (gameId, settings) => {
  return prisma.game.update({
    where: { id: Number(gameId) },
    data: {
      quarterLength: settings.quarterLength,
      totalQuarters: settings.totalQuarters,
      overtimeLength: settings.overtimeLength,
    },
    include: {
      teamHome: true,
      teamAway: true,
    },
  });
};

export const nextQuarter = async (gameId) => {
  return prisma.$transaction(async (tx) => {
    const game = await tx.game.findUnique({
      where: { id: Number(gameId) },
      include: {
        teamHome: true,
        teamAway: true,
      },
    });

    if (!game) {
      throw new Error("Juego no encontrado");
    }

    const nextQuarterNum = game.currentQuarter + 1;
    let gameStatus = game.estado;
    let isOvertime = game.isOvertime;

    // Check if regulation time is over
    if (nextQuarterNum > game.totalQuarters && !game.isOvertime) {
      // Check for tie
      if (game.homeScore === game.awayScore) {
        // Go to overtime
        isOvertime = true;
        gameStatus = "overtime";
      } else {
        // Game finished
        gameStatus = "finished";
        return {
          game: await tx.game.update({
            where: { id: Number(gameId) },
            data: {
              estado: gameStatus,
            },
            include: {
              teamHome: true,
              teamAway: true,
            },
          }),
          message: `Juego terminado. ${
            game.homeScore > game.awayScore
              ? game.teamHome.nombre
              : game.teamAway.nombre
          } ganó ${Math.max(game.homeScore, game.awayScore)}-${Math.min(
            game.homeScore,
            game.awayScore
          )}`,
          gameEnded: true,
        };
      }
    }

    // Check if overtime should end
    if (game.isOvertime && nextQuarterNum > game.totalQuarters + 1) {
      if (game.homeScore === game.awayScore) {
        // Another overtime
        gameStatus = "overtime";
      } else {
        // Game finished
        gameStatus = "finished";
        return {
          game: await tx.game.update({
            where: { id: Number(gameId) },
            data: {
              estado: gameStatus,
            },
            include: {
              teamHome: true,
              teamAway: true,
            },
          }),
          message: `Juego terminado en overtime. ${
            game.homeScore > game.awayScore
              ? game.teamHome.nombre
              : game.teamAway.nombre
          } ganó ${Math.max(game.homeScore, game.awayScore)}-${Math.min(
            game.homeScore,
            game.awayScore
          )}`,
          gameEnded: true,
        };
      }
    }

    // Move to next quarter/overtime
    const updatedGame = await tx.game.update({
      where: { id: Number(gameId) },
      data: {
        currentQuarter: nextQuarterNum,
        quarterTime: 0,
        isOvertime: isOvertime,
        estado: gameStatus,
      },
      include: {
        teamHome: true,
        teamAway: true,
      },
    });

    return {
      game: updatedGame,
      message: isOvertime
        ? `Overtime ${nextQuarterNum - game.totalQuarters}`
        : `Cuarto ${nextQuarterNum}`,
      gameEnded: false,
    };
  });
};

export const updateQuarterTime = async (gameId, quarterTime) => {
  return prisma.game.update({
    where: { id: Number(gameId) },
    data: { quarterTime: Number(quarterTime) },
    include: {
      teamHome: true,
      teamAway: true,
    },
  });
};

export const recordTurnover = async (gameId, playerId) => {
  // Validate that the game exists and is currently running
  const game = await prisma.game.findUnique({
    where: { id: Number(gameId) },
    include: {
      activePlayers: true,
    },
  });

  if (!game) {
    throw new Error("Partido no encontrado");
  }

  if (game.estado !== "in_progress") {
    throw new Error(
      "No se pueden registrar estadísticas cuando el juego no está en progreso"
    );
  }

  // Validate that the player is currently active (not on bench)
  const isPlayerActive = game.activePlayers.some(
    (p) => p.id === Number(playerId)
  );

  if (!isPlayerActive) {
    throw new Error(
      "No se pueden registrar estadísticas para jugadores que están en el banquillo"
    );
  }

  // Use upsert to either create or update, preserving existing values
  return prisma.playerGameStats.upsert({
    where: {
      gameId_playerId: {
        gameId: Number(gameId),
        playerId: Number(playerId),
      },
    },
    update: {
      perdidas: { increment: 1 },
    },
    create: {
      gameId: Number(gameId),
      playerId: Number(playerId),
      puntos: 0,
      rebotes: 0,
      asistencias: 0,
      robos: 0,
      tapones: 0,
      tirosIntentados: 0,
      tirosAnotados: 0,
      tiros3Intentados: 0,
      tiros3Anotados: 0,
      tirosLibresIntentados: 0,
      tirosLibresAnotados: 0,
      perdidas: 1,
      faltasPersonales: 0,
      faltasQ1: 0,
      faltasQ2: 0,
      faltasQ3: 0,
      faltasQ4: 0,
      faltasOT: 0,
      minutos: 0,
      plusMinus: 0,
      isStarter: false,
      puntosQ1: 0,
      puntosQ2: 0,
      puntosQ3: 0,
      puntosQ4: 0,
      puntosOT: 0,
    },
  });
};

export const recordPersonalFoul = async (gameId, playerId) => {
  return prisma.$transaction(async (tx) => {
    // Validate that the game exists and is currently running
    const game = await tx.game.findUnique({
      where: { id: Number(gameId) },
      include: {
        activePlayers: true,
      },
    });

    if (!game) {
      throw new Error("Partido no encontrado");
    }

    if (game.estado !== "in_progress") {
      throw new Error(
        "No se pueden registrar estadísticas cuando el juego no está en progreso"
      );
    }

    // Note: Players can commit fouls even when on the bench, so we don't check if they're active

    // Determine which quarter we're in for fouls tracking
    let quarterFoulsField = '';
    if (game.isOvertime) {
      quarterFoulsField = 'faltasOT';
    } else {
      switch (game.currentQuarter) {
        case 1: quarterFoulsField = 'faltasQ1'; break;
        case 2: quarterFoulsField = 'faltasQ2'; break;
        case 3: quarterFoulsField = 'faltasQ3'; break;
        case 4: quarterFoulsField = 'faltasQ4'; break;
        default: quarterFoulsField = 'faltasOT'; break;
      }
    }

    // Use upsert to either create or update, preserving existing values
    const updatedPlayerStats = await tx.playerGameStats.upsert({
      where: {
        gameId_playerId: {
          gameId: Number(gameId),
          playerId: Number(playerId),
        },
      },
      update: {
        faltasPersonales: { increment: 1 },
        [quarterFoulsField]: { increment: 1 },
      },
      create: {
        gameId: Number(gameId),
        playerId: Number(playerId),
        puntos: 0,
        rebotes: 0,
        asistencias: 0,
        robos: 0,
        tapones: 0,
        tirosIntentados: 0,
        tirosAnotados: 0,
        tiros3Intentados: 0,
        tiros3Anotados: 0,
        tirosLibresIntentados: 0,
        tirosLibresAnotados: 0,
        perdidas: 0,
        faltasPersonales: 1,
        faltasQ1: quarterFoulsField === 'faltasQ1' ? 1 : 0,
        faltasQ2: quarterFoulsField === 'faltasQ2' ? 1 : 0,
        faltasQ3: quarterFoulsField === 'faltasQ3' ? 1 : 0,
        faltasQ4: quarterFoulsField === 'faltasQ4' ? 1 : 0,
        faltasOT: quarterFoulsField === 'faltasOT' ? 1 : 0,
        minutos: 0,
        plusMinus: 0,
        isStarter: false,
        puntosQ1: 0,
        puntosQ2: 0,
        puntosQ3: 0,
        puntosQ4: 0,
        puntosOT: 0,
      },
    });

    // Get player info for response
    const player = await tx.player.findUnique({
      where: { id: Number(playerId) },
      include: { team: true },
    });

    return {
      success: true,
      foul: {
        player: {
          id: player.id,
          name: `${player.nombre} ${player.apellido}`,
          number: player.numero,
          team: player.team.nombre,
        },
        quarter: game.isOvertime ? 'OT' : `Q${game.currentQuarter}`,
        totalFouls: updatedPlayerStats.faltasPersonales,
        description: `Falta personal de ${player.nombre} ${player.apellido} - Total: ${updatedPlayerStats.faltasPersonales} faltas`,
      },
      playerStats: updatedPlayerStats,
    };
  });
};

export const checkGameEnd = async (gameId) => {
  const game = await prisma.game.findUnique({
    where: { id: Number(gameId) },
    include: {
      teamHome: true,
      teamAway: true,
    },
  });

  if (!game) {
    throw new Error("Juego no encontrado");
  }

  const quarterLength = game.isOvertime
    ? game.overtimeLength
    : game.quarterLength;
  const isQuarterFinished = game.quarterTime >= quarterLength;
  const isRegulationFinished =
    game.currentQuarter >= game.totalQuarters && isQuarterFinished;
  const isOvertimeFinished = game.isOvertime && isQuarterFinished;

  return {
    game,
    isQuarterFinished,
    isRegulationFinished,
    isOvertimeFinished,
    isTied: game.homeScore === game.awayScore,
    needsOvertime:
      isRegulationFinished &&
      game.homeScore === game.awayScore &&
      !game.isOvertime,
    canEndGame:
      (isRegulationFinished || isOvertimeFinished) &&
      game.homeScore !== game.awayScore,
    timeRemaining: quarterLength - game.quarterTime,
    quarterProgress: (game.quarterTime / quarterLength) * 100,
  };
};

export const startGame = async (gameId, activePlayerIds, gameSettings) => {
  return prisma.$transaction(async (tx) => {
    // Validate game exists and is not already started
    const game = await tx.game.findUnique({
      where: { id: Number(gameId) },
      include: {
        teamHome: { include: { players: true } },
        teamAway: { include: { players: true } },
      },
    });

    if (!game) {
      throw new Error("Juego no encontrado");
    }

    if (game.estado === "in_progress") {
      throw new Error("El juego ya está en progreso");
    }

    // Validate active players (should be 5 per team = 10 total)
    if (!activePlayerIds || activePlayerIds.length !== 10) {
      throw new Error(
        "Debe seleccionar exactamente 10 jugadores activos (5 por equipo)"
      );
    }

    // Validate players belong to the teams
    const allTeamPlayers = [...game.teamHome.players, ...game.teamAway.players];
    const invalidPlayers = activePlayerIds.filter(
      (id) => !allTeamPlayers.some((player) => player.id === Number(id))
    );

    if (invalidPlayers.length > 0) {
      throw new Error(`Jugadores inválidos: ${invalidPlayers.join(", ")}`);
    }

    // Update game settings if provided
    const updateData = {
      estado: "in_progress",
      currentQuarter: 1,
      quarterTime: 0,
      gameTime: 0,
      isOvertime: false,
      activePlayers: {
        set: activePlayerIds.map((id) => ({ id: Number(id) })),
      },
    };

    if (gameSettings) {
      if (gameSettings.quarterLength)
        updateData.quarterLength = gameSettings.quarterLength;
      if (gameSettings.totalQuarters)
        updateData.totalQuarters = gameSettings.totalQuarters;
      if (gameSettings.overtimeLength)
        updateData.overtimeLength = gameSettings.overtimeLength;
    }

    // Start the game
    const updatedGame = await tx.game.update({
      where: { id: Number(gameId) },
      data: updateData,
      include: {
        teamHome: { include: { players: true } },
        teamAway: { include: { players: true } },
        activePlayers: true,
      },
    });

    // Initialize player stats for active players
    for (const playerId of activePlayerIds) {
      await tx.playerGameStats.upsert({
        where: {
          gameId_playerId: {
            gameId: Number(gameId),
            playerId: Number(playerId),
          },
        },
        update: {},
        create: {
          gameId: Number(gameId),
          playerId: Number(playerId),
          puntos: 0,
          rebotes: 0,
          asistencias: 0,
          robos: 0,
          tapones: 0,
          tirosIntentados: 0,
          tirosAnotados: 0,
          tiros3Intentados: 0,
          tiros3Anotados: 0,
          minutos: 0,
          plusMinus: 0,
          perdidas: 0,
        },
      });
    }

    return {
      success: true,
      message: "Juego iniciado correctamente",
      game: updatedGame,
      activePlayers: updatedGame.activePlayers,
      gameSettings: {
        quarterLength: updatedGame.quarterLength,
        totalQuarters: updatedGame.totalQuarters,
        overtimeLength: updatedGame.overtimeLength,
      },
    };
  });
};
