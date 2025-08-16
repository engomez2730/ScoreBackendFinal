import * as teamService from "../services/teamService.js";

export const getTeams = async (req, res) => {
  const teams = await teamService.getAllTeams();
  res.json(teams);
};

export const getTeam = async (req, res) => {
  const team = await teamService.getTeamById(req.params.id);
  if (!team) return res.status(404).json({ error: "Equipo no encontrado" });
  res.json(team);
};

export const createTeam = async (req, res) => {
  const { nombre, logo } = req.body;
  try {
    const team = await teamService.createTeam({ nombre, logo });
    res.status(201).json(team);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateTeam = async (req, res) => {
  const { nombre, logo } = req.body;
  try {
    const team = await teamService.updateTeam(req.params.id, { nombre, logo });
    res.json(team);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    await teamService.deleteTeam(req.params.id);
    res.json({ message: "Equipo eliminado" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
