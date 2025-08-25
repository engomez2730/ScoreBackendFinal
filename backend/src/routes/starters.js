import express from 'express';
import * as starterController from '../controllers/starterController.js';

const router = express.Router();

// Set starting players for both teams
router.post('/game/:gameId/starters', starterController.setStartingPlayers);

export default router;
