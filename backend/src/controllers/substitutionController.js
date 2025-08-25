import * as substitutionService from "../services/substitutionService.js";
import * as gameService from "../services/gameService.js";

export const getSubstitutionsByGame = async (req, res) => {
  try {
    const subs = await substitutionService.getSubstitutionsByGame(
      req.params.gameId
    );
    res.json(subs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getSubstitutionsByTeam = async (req, res) => {
  try {
    const { gameId, teamType } = req.params;
    if (teamType !== 'home' && teamType !== 'away') {
      return res.status(400).json({ error: "El tipo de equipo debe ser 'home' o 'away'" });
    }
    const subs = await substitutionService.getSubstitutionsByTeam(gameId, teamType);
    res.json(subs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createSubstitution = async (req, res) => {
  const { gameId, playerInId, playerOutId, gameTime } = req.body;

  if (!gameId || !playerInId || !playerOutId || gameTime === undefined) {
    return res.status(400).json({ 
      error: "Se requiere gameId, playerInId, playerOutId y gameTime" 
    });
  }

  try {
    const result = await gameService.makeSubstitution(
      gameId,
      playerOutId,
      playerInId,
      gameTime
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createTeamSubstitution = async (req, res) => {
  const { gameId, playerInId, playerOutId, gameTime } = req.body;
  const { teamType } = req.params;

  if (!gameId || !playerInId || !playerOutId || gameTime === undefined) {
    return res.status(400).json({ 
      error: "Se requiere gameId, playerInId, playerOutId y gameTime" 
    });
  }
  
  // Convert IDs to numbers
  const numericGameId = Number(gameId);
  const numericPlayerInId = Number(playerInId);
  const numericPlayerOutId = Number(playerOutId);
  const numericGameTime = Number(gameTime);
  
  if (isNaN(numericGameId) || isNaN(numericPlayerInId) || isNaN(numericPlayerOutId) || isNaN(numericGameTime)) {
    return res.status(400).json({
      error: "Los IDs y el tiempo de juego deben ser números válidos"
    });
  }

  if (teamType !== 'home' && teamType !== 'away') {
    return res.status(400).json({ 
      error: "El tipo de equipo debe ser 'home' o 'away'" 
    });
  }

  try {
    // First verify both players belong to the correct team
    const game = await gameService.getGameById(numericGameId);
    
    if (!game) {
      return res.status(404).json({ error: "Juego no encontrado" });
    }
    
    const expectedTeamId = teamType === 'home' ? game.teamHomeId : game.teamAwayId;
    
    const result = await gameService.makeSubstitution(
      numericGameId,
      numericPlayerOutId,
      numericPlayerInId,
      numericGameTime,
      expectedTeamId // Add team validation
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
