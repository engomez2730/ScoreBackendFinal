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
  const { eventId, teamHomeId, teamAwayId, fecha, estado } = req.body;
  try {
    const game = await gameService.updateGame(req.params.id, {
      eventId,
      teamHomeId,
      teamAwayId,
      fecha: new Date(fecha),
      estado,
    });
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
    const game = await gameService.updateScore(req.params.id, homeScore, awayScore);
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updatePlayerStats = async (req, res) => {
  const { playerId, stats } = req.body;
  try {
    const playerStats = await gameService.updatePlayerStats(req.params.id, playerId, stats);
    res.json(playerStats);
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

export const updateActivePlayers = async (req, res) => {
  const { playerIds } = req.body;
  try {
    const game = await gameService.updateActivePlayers(req.params.id, playerIds);
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const makeSubstitution = async (req, res) => {
  const { playerOutId, playerInId, timestamp } = req.body;
  try {
    const substitution = await gameService.makeSubstitution(req.params.id, playerOutId, playerInId, timestamp);
    res.json(substitution);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const recordShot = async (req, res) => {
  const { playerId, shotType, made } = req.body;
  try {
    const result = await gameService.recordShot(req.params.id, playerId, shotType, made);
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
      overtimeLength
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
    const game = await gameService.updateQuarterTime(req.params.id, quarterTime);
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
