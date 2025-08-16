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
