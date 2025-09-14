export const fullUpdateGame = async (req, res) => {
  try {
    const gameId = req.params.id;
    const {
      homeScore,
      awayScore,
      currentQuarter,
      quarterTime,
      gameTime,
      playerStats,
    } = req.body;
    const result = await gameService.fullUpdateGame(gameId, {
      homeScore,
      awayScore,
      currentQuarter,
      quarterTime,
      gameTime,
      playerStats,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
import * as gameService from "../services/gameService.js";

export const getGames = async (req, res) => {
  const games = await gameService.getAllGames();
  res.json(games);
};

export const getGame = async (req, res) => {
  const game = await gameService.getGameById(req.params.id);
  if (!game) return res.status(404).json({ error: "Juego no encontrado" });
  res.json(game);
};

export const createGame = async (req, res) => {
  const { eventId, teamHomeId, teamAwayId, fecha, estado } = req.body;
  try {
    const game = await gameService.createGame({
      eventId,
      teamHomeId,
      teamAwayId,
      fecha: new Date(fecha),
      estado,
    });
    res.status(201).json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateGame = async (req, res) => {
  try {
    // Get current game data
    const currentGame = await gameService.getGameById(req.params.id);
    if (!currentGame) {
      return res.status(404).json({ error: "Juego no encontrado" });
    }

    // Prepare update data with current values as defaults
    const updateData = {
      eventId: req.body.eventId || currentGame.eventId,
      teamHomeId: req.body.teamHomeId || currentGame.teamHomeId,
      teamAwayId: req.body.teamAwayId || currentGame.teamAwayId,
      fecha: req.body.fecha ? new Date(req.body.fecha) : currentGame.fecha,
      estado: req.body.estado || currentGame.estado,
    };

    const game = await gameService.updateGame(req.params.id, updateData);
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteGame = async (req, res) => {
  try {
    await gameService.deleteGame(req.params.id);
    res.json({ message: "Juego eliminado" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteAllGames = async (req, res) => {
  try {
    await gameService.deleteAllGames();
    res.json({ message: "Todos los juegos han sido eliminados" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateGameTime = async (req, res) => {
  const { gameTime } = req.body;
  try {
    const game = await gameService.updateGameTime(req.params.id, gameTime);
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const resetGameTime = async (req, res) => {
  try {
    const game = await gameService.updateGameTime(req.params.id, 0);
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateScore = async (req, res) => {
  const { homeScore, awayScore } = req.body;
  try {
    const game = await gameService.updateScore(
      req.params.id,
      homeScore,
      awayScore
    );
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updatePlayerStats = async (req, res) => {
  const { playerId, stats } = req.body;
  try {
    const playerStats = await gameService.updatePlayerStats(
      req.params.id,
      playerId,
      stats
    );
    res.json(playerStats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updatePlayerMinutes = async (req, res) => {
  try {
    const result = await gameService.updatePlayerMinutes(
      req.params.id,
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getGameStats = async (req, res) => {
  try {
    const stats = await gameService.getGameStats(req.params.id);
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getActivePlayers = async (req, res) => {
  try {
    const game = await gameService.getGameById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: "Juego no encontrado" });
    }
    const activePlayers = await gameService.getActivePlayers(req.params.id);
    res.json(activePlayers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateHomeActivePlayers = async (req, res) => {
  const { playerIds } = req.body;
  try {
    if (!playerIds || !Array.isArray(playerIds)) {
      return res
        .status(400)
        .json({ error: "Se requiere un array de IDs de jugadores" });
    }

    if (playerIds.length !== 5) {
      return res
        .status(400)
        .json({ error: "Se requieren exactamente 5 jugadores" });
    }

    const result = await gameService.updateTeamActivePlayers(
      req.params.id,
      playerIds,
      "home"
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateAwayActivePlayers = async (req, res) => {
  const { playerIds } = req.body;
  try {
    if (!playerIds || !Array.isArray(playerIds)) {
      return res
        .status(400)
        .json({ error: "Se requiere un array de IDs de jugadores" });
    }

    if (playerIds.length !== 5) {
      return res
        .status(400)
        .json({ error: "Se requieren exactamente 5 jugadores" });
    }

    const result = await gameService.updateTeamActivePlayers(
      req.params.id,
      playerIds,
      "away"
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getBenchPlayers = async (req, res) => {
  try {
    const benchPlayers = await gameService.getBenchPlayers(req.params.id);
    res.json(benchPlayers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getHomeBenchPlayers = async (req, res) => {
  try {
    const benchPlayers = await gameService.getTeamBenchPlayers(
      req.params.id,
      "home"
    );
    res.json(benchPlayers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAwayBenchPlayers = async (req, res) => {
  try {
    const benchPlayers = await gameService.getTeamBenchPlayers(
      req.params.id,
      "away"
    );
    res.json(benchPlayers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const makeSubstitution = async (req, res) => {
  const { playerInId, playerOutId, gameTime } = req.body;

  if (!playerInId || !playerOutId || gameTime === undefined) {
    return res.status(400).json({
      error:
        "Se requiere playerInId (jugador que entra), playerOutId (jugador que sale) y gameTime (tiempo actual del juego)",
    });
  }

  try {
    const result = await gameService.makeSubstitution(
      req.params.id,
      playerInId,
      playerOutId,
      gameTime
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const recordShot = async (req, res) => {
  const { playerId, shotType, made, gameTime } = req.body;
  if (gameTime === undefined) {
    return res
      .status(400)
      .json({ error: "Se requiere el tiempo actual del juego (gameTime)" });
  }
  try {
    const result = await gameService.recordShot(
      req.params.id,
      playerId,
      shotType,
      made,
      gameTime
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const recordRebound = async (req, res) => {
  const { playerId } = req.body;
  try {
    const result = await gameService.recordRebound(req.params.id, playerId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const recordAssist = async (req, res) => {
  const { playerId } = req.body;
  try {
    const result = await gameService.recordAssist(req.params.id, playerId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const recordSteal = async (req, res) => {
  const { playerId } = req.body;
  try {
    const result = await gameService.recordSteal(req.params.id, playerId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const recordBlock = async (req, res) => {
  const { playerId } = req.body;
  try {
    const result = await gameService.recordBlock(req.params.id, playerId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateGameSettings = async (req, res) => {
  const { quarterLength, totalQuarters, overtimeLength } = req.body;
  try {
    const game = await gameService.updateGameSettings(req.params.id, {
      quarterLength,
      totalQuarters,
      overtimeLength,
    });
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const nextQuarter = async (req, res) => {
  try {
    const result = await gameService.nextQuarter(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateQuarterTime = async (req, res) => {
  const { quarterTime } = req.body;
  try {
    const game = await gameService.updateQuarterTime(
      req.params.id,
      quarterTime
    );
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const checkGameEnd = async (req, res) => {
  try {
    const result = await gameService.checkGameEnd(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const startGame = async (req, res) => {
  const { activePlayerIds, gameSettings } = req.body;
  try {
    const result = await gameService.startGame(
      req.params.id,
      activePlayerIds,
      gameSettings
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const recordTurnover = async (req, res) => {
  try {
    const { playerId } = req.body;
    const gameId = req.params.id;
    const result = await gameService.recordTurnover(gameId, playerId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
