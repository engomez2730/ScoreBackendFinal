import express from "express";
import * as userGameController from "../controllers/userGameController.js";
import { authenticateToken, checkGamePermissions } from "../middleware/auth.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Gestión de sesiones de usuario en juegos
router.post("/games/:gameId/join", userGameController.joinGame);
router.post("/games/:gameId/leave", userGameController.leaveGame);
router.get("/games/:gameId/users", userGameController.getGameUsers);

// Gestión de permisos
router.post(
  "/games/:gameId/users/:userId/permissions",
  checkGamePermissions(["canManagePermissions"]),
  userGameController.assignPermissions
);

router.get(
  "/games/:gameId/users/:userId/permissions",
  userGameController.getUserPermissions
);

router.get("/games/:gameId/permissions", userGameController.getGamePermissions);

router.delete(
  "/games/:gameId/users/:userId/permissions",
  checkGamePermissions(["canManagePermissions"]),
  userGameController.removePermissions
);

// Ruta para obtener permisos del usuario actual
router.get(
  "/games/:gameId/my-permissions",
  userGameController.getUserPermissions
);

export default router;
