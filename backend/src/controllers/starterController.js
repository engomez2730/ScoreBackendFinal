import * as gameService from '../services/gameService.js';

export const setStartingPlayers = async (req, res) => {
  const { gameId } = req.params;
  const { homeStarters, awayStarters } = req.body;

  if (!gameId || !homeStarters || !awayStarters) {
    return res.status(400).json({
      error: "Se requiere gameId, homeStarters y awayStarters"
    });
  }

  try {
    const result = await gameService.setStartingPlayers(
      gameId,
      homeStarters,
      awayStarters
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
