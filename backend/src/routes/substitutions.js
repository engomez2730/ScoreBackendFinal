import express from "express";
import * as substitutionController from "../controllers/substitutionController.js";

const router = express.Router();

// Obtener sustituciones de un juego
router.get("/game/:gameId", substitutionController.getSubstitutionsByGame);

// Crear sustitución
router.post("/", substitutionController.createSubstitution);

export default router;
