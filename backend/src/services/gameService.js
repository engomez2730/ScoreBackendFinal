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

export const deleteAllGames = async () => {
  return prisma.game.deleteMany({});
};

export const updateGameTime = async (id, gameTime) => {
  return prisma.game.update({
    where: { id: Number(id) },
    data: { gameTime: Number(gameTime) },
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

export const updateActivePlayers = async (id, playerIds) => {
  return prisma.game.update({
    where: { id: Number(id) },
    data: {
      activePlayers: {
        set: playerIds.map(id => ({ id: Number(id) }))
      }
    },
    include: {
      activePlayers: true
    }
  });
};

export const makeSubstitution = async (gameId, playerOutId, playerInId, timestamp) => {
  return prisma.substitution.create({
    data: {
      gameId: Number(gameId),
      playerOutId: Number(playerOutId),
      playerInId: Number(playerInId),
      timestamp: new Date(timestamp || Date.now())
    },
    include: {
      playerIn: true,
      playerOut: true,
      game: true
    }
  });
};

export const recordShot = async (gameId, playerId, shotType, made) => {
  return prisma.$transaction(async (tx) => {
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
