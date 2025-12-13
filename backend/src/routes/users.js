import express from "express";
import * as userController from "../controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/users - Obtener todos los usuarios
router.get("/", userController.getAllUsers);

// GET /api/users/:id - Obtener un usuario por ID
router.get("/:id", userController.getUserById);

// PUT /api/users/:id - Actualizar un usuario
router.put("/:id", userController.updateUser);

// DELETE /api/users/:id - Eliminar un usuario (desactivar)
router.delete("/:id", userController.deleteUser);

// PUT /api/users/:id/password - Cambiar contraseña de un usuario
router.put("/:id/password", userController.changeUserPassword);

export default router;