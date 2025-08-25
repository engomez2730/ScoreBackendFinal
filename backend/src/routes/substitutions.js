import express from "express";
import * as substitutionController from "../controllers/substitutionController.js";

const router = express.Router();

// Obtener sustituciones de un juego
router.get("/game/:gameId", substitutionController.getSubstitutionsByGame);

// Obtener sustituciones por equipo en un juego
router.get("/game/:gameId/team/:teamType", substitutionController.getSubstitutionsByTeam);

// Crear sustitución general
router.post("/", substitutionController.createSubstitution);

// Crear sustitución específica por equipo
router.post("/team/:teamType", substitutionController.createTeamSubstitution);

export default router;
