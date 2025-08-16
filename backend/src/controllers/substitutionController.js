import * as substitutionService from "../services/substitutionService.js";

export const getSubstitutionsByGame = async (req, res) => {
  const subs = await substitutionService.getSubstitutionsByGame(
    req.params.gameId
  );
  res.json(subs);
};

export const createSubstitution = async (req, res) => {
  try {
    const sub = await substitutionService.createSubstitution(req.body);
    res.status(201).json(sub);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
