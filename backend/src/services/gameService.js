export const fullUpdateGame = async (gameId, { homeScore, awayScore, currentQuarter, quarterTime, gameTime, playerStats }) => {
  return prisma.$transaction(async (tx) => {
    // Update game details
    const updatedGame = await tx.game.update({
      where: { id: Number(gameId) },
      data: {
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        currentQuarter: Number(currentQuarter),
        quarterTime: Number(quarterTime),
        gameTime: Number(gameTime)
      }
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
              playerId: Number(playerId)
            }
          },
          update: rest,
          create: {
            gameId: Number(gameId),
            playerId: Number(playerId),
            ...rest
          }
        });
        updatedStats.push(updated);
      }
    }

    return {
      game: updatedGame,
      playerStats: updatedStats
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
    where: { teamId: Number(teamId) }
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
      throw new Error("Cada equipo debe tener al menos 10 jugadores para comenzar el juego");
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

export const setStartingPlayers = async (gameId, homeStarters, awayStarters) => {
  return prisma.$transaction(async (tx) => {
    const game = await tx.game.findUnique({
      where: { id: Number(gameId) },
      include: {
        teamHome: {
          include: { players: true }
        },
        teamAway: {
          include: { players: true }
        },
        activePlayers: true
      }
    });

    if (!game) {
      throw new Error("Juego no encontrado");
    }

    // Validate the number of starters
    if (homeStarters.length !== 5 || awayStarters.length !== 5) {
      throw new Error("Cada equipo debe tener exactamente 5 jugadores titulares");
    }

    // Verify all home starters exist and belong to home team
    const homeStarterPlayers = await tx.player.findMany({
      where: { 
        id: { in: homeStarters.map(id => Number(id)) },
        teamId: game.teamHomeId
      }
    });

    if (homeStarterPlayers.length !== 5) {
      throw new Error("Uno o más jugadores titulares del equipo local no existen o no pertenecen al equipo");
    }

    // Verify all away starters exist and belong to away team
    const awayStarterPlayers = await tx.player.findMany({
      where: { 
        id: { in: awayStarters.map(id => Number(id)) },
        teamId: game.teamAwayId
      }
    });

    if (awayStarterPlayers.length !== 5) {
      throw new Error("Uno o más jugadores titulares del equipo visitante no existen o no pertenecen al equipo");
    }

    // Combine all starters
    const allStarters = [...homeStarters, ...awayStarters].map(id => Number(id));

    // Update active players
    const updatedGame = await tx.game.update({
      where: { id: Number(gameId) },
      data: {
        activePlayers: {
          set: allStarters.map(id => ({ id }))
        }
      },
      include: {
        activePlayers: {
          include: {
            team: true
          }
        },
        teamHome: true,
        teamAway: true
      }
    });

    // Organize players by team for the response
    const homePlayers = updatedGame.activePlayers.filter(p => p.teamId === updatedGame.teamHomeId);
    const awayPlayers = updatedGame.activePlayers.filter(p => p.teamId === updatedGame.teamAwayId);

    return {
      homeTeam: {
        id: updatedGame.teamHomeId,
        name: updatedGame.teamHome.nombre,
        starters: homePlayers.map(player => ({
          id: player.id,
          nombre: player.nombre,
          apellido: player.apellido,
          numero: player.numero,
          posicion: player.posicion
        }))
      },
      awayTeam: {
        id: updatedGame.teamAwayId,
        name: updatedGame.teamAway.nombre,
        starters: awayPlayers.map(player => ({
          id: player.id,
          nombre: player.nombre,
          apellido: player.apellido,
          numero: player.numero,
          posicion: player.posicion
        }))
      }
    };
  });
};

export const updateScore = async (id, homeScore, awayScore) => {
  return prisma.game.update({
    where: { id: Number(id) },
    data: {
      homeScore: Number(homeScore),
      awayScore: Number(awayScore)
    },
  });
};

export const updatePlayerStats = async (gameId, playerId, stats) => {
  return prisma.playerGameStats.upsert({
    where: {
      gameId_playerId: {
        gameId: Number(gameId),
        playerId: Number(playerId)
      }
    },
    update: stats,
    create: {
      gameId: Number(gameId),
      playerId: Number(playerId),
      ...stats
    },
  });
};

export const getGameStats = async (id) => {
  return prisma.playerGameStats.findMany({
    where: { gameId: Number(id) },
    include: {
      player: true
    }
  });
};

export const getActivePlayers = async (id) => {
  const game = await prisma.game.findUnique({
    where: { id: Number(id) },
    include: {
      activePlayers: {
        include: {
          team: true  // Include team information for each player
        }
      },
      teamHome: true,
      teamAway: true
    }
  });

  if (!game) {
    throw new Error("Juego no encontrado");
  }

  // Separate players by team
  const homePlayers = game.activePlayers.filter(player => player.teamId === game.teamHomeId);
  const awayPlayers = game.activePlayers.filter(player => player.teamId === game.teamAwayId);

  return {
    homeTeam: {
      name: game.teamHome.nombre,
      players: homePlayers
    },
    awayTeam: {
      name: game.teamAway.nombre,
      players: awayPlayers
    }
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
        activePlayers: true
      }
    });

    if (!game) {
      throw new Error("Juego no encontrado");
    }

    // Get all players to be set as active
    const players = await tx.player.findMany({
      where: {
        id: {
          in: playerIds.map(id => Number(id))
        }
      }
    });

    // Validate all players exist
    if (players.length !== playerIds.length) {
      throw new Error("Uno o más jugadores no existen");
    }

    // Validate players belong to the correct team
    const expectedTeamId = teamType === 'home' ? game.teamHomeId : game.teamAwayId;
    const invalidPlayers = players.filter(p => p.teamId !== expectedTeamId);
    if (invalidPlayers.length > 0) {
      throw new Error("Uno o más jugadores no pertenecen al equipo correcto");
    }

    // Get current active players from the other team
    const otherTeamId = teamType === 'home' ? game.teamAwayId : game.teamHomeId;
    const otherTeamPlayers = game.activePlayers.filter(p => p.teamId === otherTeamId);

    // Prepare the complete list of active players (new team players + other team's existing players)
    const allActivePlayerIds = [
      ...playerIds,
      ...otherTeamPlayers.map(p => p.id)
    ];

    // Update active players
    const updatedGame = await tx.game.update({
      where: { id: Number(id) },
      data: {
        activePlayers: {
          set: allActivePlayerIds.map(id => ({ id: Number(id) }))
        }
      },
      include: {
        activePlayers: {
          include: {
            team: true
          }
        },
        teamHome: true,
        teamAway: true
      }
    });

    // Organize players by team for the response
    const homePlayers = updatedGame.activePlayers.filter(p => p.teamId === updatedGame.teamHomeId);
    const awayPlayers = updatedGame.activePlayers.filter(p => p.teamId === updatedGame.teamAwayId);

    return {
      homeTeam: {
        id: updatedGame.teamHomeId,
        name: updatedGame.teamHome.nombre,
        players: homePlayers
      },
      awayTeam: {
        id: updatedGame.teamAwayId,
        name: updatedGame.teamAway.nombre,
        players: awayPlayers
      }
    };
  });
};

export const getBenchPlayers = async (gameId) => {
  const game = await prisma.game.findUnique({
    where: { id: Number(gameId) },
    include: {
      teamHome: {
        include: {
          players: true
        }
      },
      teamAway: {
        include: {
          players: true
        }
      },
      activePlayers: true
    }
  });

  if (!game) {
    throw new Error("Juego no encontrado");
  }

  // Get all players from both teams
  const homePlayers = game.teamHome.players;
  const awayPlayers = game.teamAway.players;

  // Get active player IDs
  const activePlayerIds = new Set(game.activePlayers.map(p => p.id));

  // Filter out active players to get bench players
  const homeBench = homePlayers.filter(p => !activePlayerIds.has(p.id));
  const awayBench = awayPlayers.filter(p => !activePlayerIds.has(p.id));

  return {
    homeTeam: {
      id: game.teamHomeId,
      name: game.teamHome.nombre,
      benchPlayers: homeBench
    },
    awayTeam: {
      id: game.teamAwayId,
      name: game.teamAway.nombre,
      benchPlayers: awayBench
    }
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
              posicion: true
            }
          }
        }
      },
      teamAway: {
        include: {
          players: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              numero: true,
              posicion: true
            }
          }
        }
      },
      activePlayers: {
        select: {
          id: true
        }
      }
    }
  });

  if (!game) {
    throw new Error("Juego no encontrado");
  }

  // Get active player IDs
  const activePlayerIds = new Set(game.activePlayers.map(p => p.id));

  // Get the requested team's players
  const team = teamType === 'home' ? game.teamHome : game.teamAway;
  const benchPlayers = team.players.filter(p => !activePlayerIds.has(p.id));

  return {
    teamId: team.id,
    teamName: team.nombre,
    benchPlayers: benchPlayers.map(player => ({
      id: player.id,
      nombre: player.nombre,
      apellido: player.apellido,
      numero: player.numero,
      posicion: player.posicion
    }))
  };
};

export const makeSubstitution = async (gameId, playerOutId, playerInId, gameTime, expectedTeamId = null) => {
  return prisma.$transaction(async (tx) => {
    const game = await tx.game.findUnique({
      where: { id: Number(gameId) },
      include: {
        activePlayers: true,
        teamHome: true,
        teamAway: true
      }
    });

    if (!game) {
      throw new Error("Juego no encontrado");
    }

    // Verify both players exist and get their details
    const [playerOut, playerIn] = await Promise.all([
      tx.player.findUnique({ where: { id: Number(playerOutId) } }),
      tx.player.findUnique({ where: { id: Number(playerInId) } })
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
      if (playerOut.teamId !== expectedTeamId || playerIn.teamId !== expectedTeamId) {
        throw new Error("Los jugadores deben pertenecer al equipo especificado");
      }
    }

    // Verify playerOut is active and playerIn is on bench
    const isPlayerOutActive = game.activePlayers.some(p => p.id === Number(playerOutId));
    const isPlayerInActive = game.activePlayers.some(p => p.id === Number(playerInId));

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
        gameTime: Number(gameTime)
      }
    });

    // Update active players
    const updatedGame = await tx.game.update({
      where: { id: Number(gameId) },
      data: {
        activePlayers: {
          disconnect: { id: Number(playerOutId) },
          connect: { id: Number(playerInId) }
        }
      },
      include: {
        activePlayers: {
          include: {
            team: true
          }
        }
      }
    });

    return {
      substitution,
      activePlayers: updatedGame.activePlayers,
      message: `Sustitución exitosa: ${playerIn.nombre} ${playerIn.apellido} entra por ${playerOut.nombre} ${playerOut.apellido}`
    };
  });
};

export const recordShot = async (gameId, playerId, shotType, made, gameTime, playerMinutes) => {
  return prisma.$transaction(async (tx) => {
    // Update game time first
    await tx.game.update({
      where: { id: Number(gameId) },
      data: { gameTime: Number(gameTime) }
    });

    // Get current player stats
    let playerStats = await tx.playerGameStats.findUnique({
      where: {
        gameId_playerId: {
          gameId: Number(gameId),
          playerId: Number(playerId)
        }
      }
    });

    // Initialize stats if they don't exist
    if (!playerStats) {
      playerStats = await tx.playerGameStats.create({
        data: {
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
          plusMinus: 0
        }
      });
    }

    // Calculate points and update stats based on basketball rules
    let points = 0;
    let updatedStats = {};

    if (shotType === '2pt' || shotType === 'field_goal') {
      // 2-point field goal
      points = made ? 2 : 0;
      updatedStats = {
        puntos: playerStats.puntos + points,
        tirosIntentados: playerStats.tirosIntentados + 1, // Field goal attempt
        tirosAnotados: playerStats.tirosAnotados + (made ? 1 : 0) // Field goal made
      };
    } else if (shotType === '3pt' || shotType === 'three_point') {
      // 3-point field goal (counts as both field goal AND 3-pointer)
      points = made ? 3 : 0;
      updatedStats = {
        puntos: playerStats.puntos + points,
        // Field goal stats (3-pointers count as field goals)
        tirosIntentados: playerStats.tirosIntentados + 1,
        tirosAnotados: playerStats.tirosAnotados + (made ? 1 : 0),
        // 3-point specific stats
        tiros3Intentados: playerStats.tiros3Intentados + 1,
        tiros3Anotados: playerStats.tiros3Anotados + (made ? 1 : 0)
      };
    } else if (shotType === 'ft' || shotType === 'free_throw') {
      // Free throw (doesn't count as field goal)
      points = made ? 1 : 0;
      updatedStats = {
        puntos: playerStats.puntos + points
        // Note: Free throws don't count as field goal attempts
      };
    }
    
    // Update minutes played with the player's actual minutes
    updatedStats.minutos = playerMinutes;

    // Update player stats
    const updatedPlayerStats = await tx.playerGameStats.update({
      where: {
        gameId_playerId: {
          gameId: Number(gameId),
          playerId: Number(playerId)
        }
      },
      data: updatedStats
    });

    // Update game score if shot was made
    let updatedGame = null;
    if (made && points > 0) {
      const game = await tx.game.findUnique({
        where: { id: Number(gameId) },
        include: { 
          teamHome: { include: { players: true } }, 
          teamAway: { include: { players: true } } 
        }
      });

      // Determine which team scored
      const isHomeTeam = game.teamHome.players.some(p => p.id === Number(playerId));
      
      updatedGame = await tx.game.update({
        where: { id: Number(gameId) },
        data: {
          homeScore: isHomeTeam ? game.homeScore + points : game.homeScore,
          awayScore: !isHomeTeam ? game.awayScore + points : game.awayScore
        },
        include: {
          teamHome: true,
          teamAway: true
        }
      });
    }

    // Get player info for response
    const player = await tx.player.findUnique({
      where: { id: Number(playerId) },
      include: { team: true }
    });

    return {
      success: true,
      shot: {
        player: {
          id: player.id,
          name: `${player.nombre} ${player.apellido}`,
          number: player.numero,
          team: player.team.nombre
        },
        shotType: shotType,
        made: made,
        points: points,
        description: getShotDescription(shotType, made, points)
      },
      playerStats: updatedPlayerStats,
      gameScore: updatedGame ? {
        homeScore: updatedGame.homeScore,
        awayScore: updatedGame.awayScore,
        homeTeam: updatedGame.teamHome.nombre,
        awayTeam: updatedGame.teamAway.nombre
      } : null
    };
  });
};

// Helper function to create descriptive shot messages
const getShotDescription = (shotType, made, points) => {
  const result = made ? 'MADE' : 'MISSED';
  
  switch(shotType) {
    case '2pt':
    case 'field_goal':
      return `${result} 2-point field goal${made ? ` (+${points} points)` : ''}`;
    case '3pt':
    case 'three_point':
      return `${result} 3-point field goal${made ? ` (+${points} points)` : ''}`;
    case 'ft':
    case 'free_throw':
      return `${result} free throw${made ? ` (+${points} point)` : ''}`;
    default:
      return `${result} shot${made ? ` (+${points} points)` : ''}`;
  }
};

export const recordRebound = async (gameId, playerId) => {
  return prisma.playerGameStats.upsert({
    where: {
      gameId_playerId: {
        gameId: Number(gameId),
        playerId: Number(playerId)
      }
    },
    update: {
      rebotes: { increment: 1 }
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
      minutos: 0,
      plusMinus: 0
    }
  });
};

export const recordAssist = async (gameId, playerId) => {
  return prisma.playerGameStats.upsert({
    where: {
      gameId_playerId: {
        gameId: Number(gameId),
        playerId: Number(playerId)
      }
    },
    update: {
      asistencias: { increment: 1 }
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
      minutos: 0,
      plusMinus: 0
    }
  });
};

export const recordSteal = async (gameId, playerId) => {
  return prisma.playerGameStats.upsert({
    where: {
      gameId_playerId: {
        gameId: Number(gameId),
        playerId: Number(playerId)
      }
    },
    update: {
      robos: { increment: 1 }
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
      minutos: 0,
      plusMinus: 0
    }
  });
};

export const recordBlock = async (gameId, playerId) => {
  return prisma.playerGameStats.upsert({
    where: {
      gameId_playerId: {
        gameId: Number(gameId),
        playerId: Number(playerId)
      }
    },
    update: {
      tapones: { increment: 1 }
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
      minutos: 0,
      plusMinus: 0
    }
  });
};

export const updateGameSettings = async (gameId, settings) => {
  return prisma.game.update({
    where: { id: Number(gameId) },
    data: {
      quarterLength: settings.quarterLength,
      totalQuarters: settings.totalQuarters,
      overtimeLength: settings.overtimeLength
    },
    include: {
      teamHome: true,
      teamAway: true
    }
  });
};

export const nextQuarter = async (gameId) => {
  return prisma.$transaction(async (tx) => {
    const game = await tx.game.findUnique({
      where: { id: Number(gameId) },
      include: {
        teamHome: true,
        teamAway: true
      }
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
        gameStatus = 'overtime';
      } else {
        // Game finished
        gameStatus = 'finished';
        return {
          game: await tx.game.update({
            where: { id: Number(gameId) },
            data: {
              estado: gameStatus
            },
            include: {
              teamHome: true,
              teamAway: true
            }
          }),
          message: `Juego terminado. ${game.homeScore > game.awayScore ? game.teamHome.nombre : game.teamAway.nombre} ganó ${Math.max(game.homeScore, game.awayScore)}-${Math.min(game.homeScore, game.awayScore)}`,
          gameEnded: true
        };
      }
    }

    // Check if overtime should end
    if (game.isOvertime && nextQuarterNum > game.totalQuarters + 1) {
      if (game.homeScore === game.awayScore) {
        // Another overtime
        gameStatus = 'overtime';
      } else {
        // Game finished
        gameStatus = 'finished';
        return {
          game: await tx.game.update({
            where: { id: Number(gameId) },
            data: {
              estado: gameStatus
            },
            include: {
              teamHome: true,
              teamAway: true
            }
          }),
          message: `Juego terminado en overtime. ${game.homeScore > game.awayScore ? game.teamHome.nombre : game.teamAway.nombre} ganó ${Math.max(game.homeScore, game.awayScore)}-${Math.min(game.homeScore, game.awayScore)}`,
          gameEnded: true
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
        estado: gameStatus
      },
      include: {
        teamHome: true,
        teamAway: true
      }
    });

    return {
      game: updatedGame,
      message: isOvertime ? `Overtime ${nextQuarterNum - game.totalQuarters}` : `Cuarto ${nextQuarterNum}`,
      gameEnded: false
    };
  });
};

export const updateQuarterTime = async (gameId, quarterTime) => {
  return prisma.game.update({
    where: { id: Number(gameId) },
    data: { quarterTime: Number(quarterTime) },
    include: {
      teamHome: true,
      teamAway: true
    }
  });
};

export const recordTurnover = async (gameId, playerId) => {
  return prisma.playerGameStats.upsert({
    where: {
      gameId_playerId: {
        gameId: Number(gameId),
        playerId: Number(playerId)
      }
    },
    update: {
      perdidas: { increment: 1 }
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
      perdidas: 1,
      minutos: 0,
      plusMinus: 0
    }
  });
};

export const checkGameEnd = async (gameId) => {
  const game = await prisma.game.findUnique({
    where: { id: Number(gameId) },
    include: {
      teamHome: true,
      teamAway: true
    }
  });

  if (!game) {
    throw new Error("Juego no encontrado");
  }

  const quarterLength = game.isOvertime ? game.overtimeLength : game.quarterLength;
  const isQuarterFinished = game.quarterTime >= quarterLength;
  const isRegulationFinished = game.currentQuarter >= game.totalQuarters && isQuarterFinished;
  const isOvertimeFinished = game.isOvertime && isQuarterFinished;

  return {
    game,
    isQuarterFinished,
    isRegulationFinished,
    isOvertimeFinished,
    isTied: game.homeScore === game.awayScore,
    needsOvertime: isRegulationFinished && game.homeScore === game.awayScore && !game.isOvertime,
    canEndGame: (isRegulationFinished || isOvertimeFinished) && game.homeScore !== game.awayScore,
    timeRemaining: quarterLength - game.quarterTime,
    quarterProgress: (game.quarterTime / quarterLength) * 100
  };
};
