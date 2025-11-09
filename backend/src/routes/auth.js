import express from "express";
import * as authController from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Rutas públicas
router.post("/login", authController.login);
router.post("/register", authController.register);

// Rutas protegidas
router.get("/profile", authenticateToken, authController.getProfile);
router.post("/verify-token", authenticateToken, authController.verifyToken);
router.post("/logout", authenticateToken, authController.logout);

export default router;
