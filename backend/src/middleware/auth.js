import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "basketball-stats-secret-key";

// Middleware para verificar JWT token
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Token de acceso requerido" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar que el usuario existe y está activo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Usuario no válido o inactivo" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Token inválido" });
  }
};

// Middleware para verificar permisos específicos en un juego
export const checkGamePermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    const gameId = req.params.id || req.params.gameId;
    const userId = req.user.id;

    if (!gameId) {
      return res.status(400).json({ error: "ID del juego requerido" });
    }

    try {
      // Verificar si el usuario es el creador del juego (tiene todos los permisos)
      const game = await prisma.game.findUnique({
        where: { id: Number(gameId) },
        select: { createdBy: true },
      });

      if (!game) {
        return res.status(404).json({ error: "Juego no encontrado" });
      }

      // Si es el creador del juego o admin, tiene todos los permisos
      if (game.createdBy === userId || req.user.rol === "ADMIN") {
        req.userPermissions = "FULL_ACCESS";
        return next();
      }

      // Verificar permisos por rol específico
      const hasRolePermissions = checkRolePermissions(
        req.user.rol,
        requiredPermissions
      );
      if (hasRolePermissions) {
        req.userPermissions = "ROLE_ACCESS";
        return next();
      }

      // Verificar permisos específicos asignados manualmente
      const permissions = await prisma.userGamePermissions.findUnique({
        where: {
          gameId_userId: {
            gameId: Number(gameId),
            userId: userId,
          },
        },
      });

      if (!permissions) {
        return res.status(403).json({
          error: "No tienes permisos para realizar esta acción en este juego",
          requiredRole: getRequiredRoleForPermissions(requiredPermissions),
          availableRoles:
            "ADMIN, REBOUNDER_ASSISTS, STEALS_BLOCKS, SCORER, ALL_AROUND",
        });
      }

      // Verificar permisos específicos requeridos
      const hasRequiredPermissions = requiredPermissions.every((permission) => {
        return permissions[permission] === true;
      });

      if (!hasRequiredPermissions) {
        return res.status(403).json({
          error: "No tienes los permisos necesarios para esta acción",
          required: requiredPermissions,
          current: permissions,
          suggestedRole: getRequiredRoleForPermissions(requiredPermissions),
        });
      }

      req.userPermissions = permissions;
      next();
    } catch (error) {
      console.error("Error verificando permisos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  };
};

// Middleware para verificar control de tiempo (crítico para no romper la lógica actual)
export const checkTimeControlPermission = async (req, res, next) => {
  const gameId = req.params.id || req.params.gameId;
  const userId = req.user.id;

  try {
    const game = await prisma.game.findUnique({
      where: { id: Number(gameId) },
      select: { createdBy: true },
    });

    // Si es el creador del juego o admin, puede controlar el tiempo
    if (game.createdBy === userId || req.user.rol === "ADMIN") {
      return next();
    }

    // Verificar si tiene permisos específicos de control de tiempo
    const permissions = await prisma.userGamePermissions.findUnique({
      where: {
        gameId_userId: {
          gameId: Number(gameId),
          userId: userId,
        },
      },
    });

    if (!permissions || !permissions.canControlTime) {
      return res.status(403).json({
        error: "Solo el controlador de tiempo puede realizar esta acción",
        message:
          "Esta acción está restringida para preservar la integridad del cálculo de minutos",
      });
    }

    next();
  } catch (error) {
    console.error("Error verificando permisos de control de tiempo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Función para generar JWT token
export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "24h" });
};

// Middleware opcional (no bloquea si no hay token)
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        isActive: true,
      },
    });

    req.user = user && user.isActive ? user : null;
  } catch (error) {
    req.user = null;
  }

  next();
};

// Función para verificar permisos por rol
const checkRolePermissions = (userRole, requiredPermissions) => {
  const rolePermissions = {
    ADMIN: ["*"], // Todos los permisos - puede hacer cualquier cosa
    REBOUNDER_ASSISTS: [
      "canEditRebounds",
      "canEditAssists", 
      "canEditTurnovers"
    ],
    STEALS_BLOCKS: [
      "canEditSteals",
      "canEditBlocks"
    ],
    SCORER: [
      "canEditPoints", 
      "canEditShots", 
      "canEditFreeThrows"
    ],
    ALL_AROUND: [
      "canEditPoints",
      "canEditRebounds",
      "canEditAssists",
      "canEditSteals",
      "canEditBlocks",
      "canEditTurnovers",
      "canEditShots",
      "canEditFreeThrows",
      "canEditPersonalFouls"
      // NO incluye canControlTime - no puede manejar tiempo
    ],
  };

  const userPermissions = rolePermissions[userRole] || [];

  // Admin tiene todos los permisos
  if (userPermissions.includes("*")) {
    return true;
  }

  // Verificar si el rol tiene todos los permisos requeridos
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission)
  );
};

// Función para sugerir el rol apropiado
const getRequiredRoleForPermissions = (requiredPermissions) => {
  if (requiredPermissions.includes("canControlTime")) {
    return "TIME_CONTROLLER";
  }
  if (
    requiredPermissions.includes("canEditPoints") &&
    requiredPermissions.includes("canEditShots")
  ) {
    return "SCORER";
  }
  if (requiredPermissions.includes("canEditRebounds")) {
    return "REBOUNDER";
  }
  if (requiredPermissions.includes("canEditAssists")) {
    return "ASSIST_TRACKER";
  }
  if (requiredPermissions.length > 3) {
    return "STATS_RECORDER";
  }
  return "USER with specific permissions";
};
