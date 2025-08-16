import * as playerService from "../services/playerService.js";

export const getPlayers = async (req, res) => {
  const players = await playerService.getAllPlayers();
  res.json(players);
};

export const getPlayer = async (req, res) => {
  const player = await playerService.getPlayerById(req.params.id);
  if (!player) return res.status(404).json({ error: "Jugador no encontrado" });
  res.json(player);
};

export const createPlayer = async (req, res) => {
  const { nombre, apellido, numero, posicion, teamId } = req.body;
  try {
    const player = await playerService.createPlayer({
      nombre,
      apellido,
      numero,
      posicion,
      teamId,
    });
    res.status(201).json(player);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updatePlayer = async (req, res) => {
  const { nombre, apellido, numero, posicion, teamId } = req.body;
  try {
    const player = await playerService.updatePlayer(req.params.id, {
      nombre,
      apellido,
      numero,
      posicion,
      teamId,
    });
    res.json(player);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deletePlayer = async (req, res) => {
  try {
    await playerService.deletePlayer(req.params.id);
    res.json({ message: "Jugador eliminado" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
