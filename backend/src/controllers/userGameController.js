import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Unir usuario a un juego
export const joinGame = async (req, res) => {
  try {
    const gameId = Number(req.params.gameId);
    const userId = req.user.id;
    const { socketId } = req.body;

    // Verificar que el juego existe
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, estado: true },
    });

    if (!game) {
      return res.status(404).json({ error: "Juego no encontrado" });
    }

    // Crear o actualizar sesión del usuario en el juego
    const gameSession = await prisma.gameSession.upsert({
      where: {
        gameId_userId: {
          gameId: gameId,
          userId: userId,
        },
      },
      update: {
        leftAt: null,
        isActive: true,
        socketId: socketId,
      },
      create: {
        gameId: gameId,
        userId: userId,
        isActive: true,
        socketId: socketId,
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
      },
    });

    res.json({
      message: "Usuario unido al juego exitosamente",
      session: gameSession,
    });
  } catch (error) {
    console.error("Error uniendo usuario al juego:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Salir de un juego
export const leaveGame = async (req, res) => {
  try {
    const gameId = Number(req.params.gameId);
    const userId = req.user.id;

    await prisma.gameSession.updateMany({
      where: {
        gameId: gameId,
        userId: userId,
        isActive: true,
      },
      data: {
        leftAt: new Date(),
        isActive: false,
        socketId: null,
      },
    });

    res.json({ message: "Usuario salió del juego exitosamente" });
  } catch (error) {
    console.error("Error saliendo del juego:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener usuarios conectados a un juego
export const getGameUsers = async (req, res) => {
  try {
    const gameId = Number(req.params.gameId);

    const gameSessions = await prisma.gameSession.findMany({
      where: {
        gameId: gameId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    res.json({
      users: gameSessions.map((session) => ({
        ...session.user,
        joinedAt: session.joinedAt,
        socketId: session.socketId,
      })),
    });
  } catch (error) {
    console.error("Error obteniendo usuarios del juego:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Asignar permisos a un usuario para un juego específico
export const assignPermissions = async (req, res) => {
  try {
    const gameId = Number(req.params.gameId);
    const targetUserId = Number(req.params.userId);
    const assignerId = req.user.id;
    const permissions = req.body;

    // Verificar que el usuario que asigna tenga permisos para hacerlo
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { createdBy: true },
    });

    if (!game) {
      return res.status(404).json({ error: "Juego no encontrado" });
    }

    // Solo el creador del juego o admin pueden asignar permisos
    if (game.createdBy !== assignerId && req.user.rol !== "ADMIN") {
      return res.status(403).json({
        error: "Solo el creador del juego puede asignar permisos",
      });
    }

    // Verificar que el usuario objetivo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, nombre: true, rol: true },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Crear o actualizar permisos
    const userPermissions = await prisma.userGamePermissions.upsert({
      where: {
        gameId_userId: {
          gameId: gameId,
          userId: targetUserId,
        },
      },
      update: {
        ...permissions,
        updatedAt: new Date(),
        createdBy: assignerId,
      },
      create: {
        gameId: gameId,
        userId: targetUserId,
        createdBy: assignerId,
        ...permissions,
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
      },
    });

    res.json({
      message: "Permisos asignados exitosamente",
      permissions: userPermissions,
    });
  } catch (error) {
    console.error("Error asignando permisos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener permisos de un usuario en un juego
export const getUserPermissions = async (req, res) => {
  try {
    const gameId = Number(req.params.gameId);
    const userId = Number(req.params.userId) || req.user.id;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { createdBy: true },
    });

    if (!game) {
      return res.status(404).json({ error: "Juego no encontrado" });
    }

    // Si es el creador del juego o admin, tiene todos los permisos
    if (game.createdBy === userId || req.user.rol === "ADMIN") {
      return res.json({
        isGameCreator: true,
        hasFullAccess: true,
        permissions: {
          canEditPoints: true,
          canEditRebounds: true,
          canEditAssists: true,
          canEditSteals: true,
          canEditBlocks: true,
          canEditTurnovers: true,
          canEditShots: true,
          canEditFreeThrows: true,
          canEditPersonalFouls: true,
          canControlTime: true,
          canMakeSubstitutions: true,
          canEndQuarter: true,
          canSetStarters: true,
          canManagePermissions: true,
          canViewAllStats: true,
        },
      });
    }

    // Buscar permisos específicos
    const permissions = await prisma.userGamePermissions.findUnique({
      where: {
        gameId_userId: {
          gameId: gameId,
          userId: userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            rol: true,
          },
        },
      },
    });

    if (!permissions) {
      return res.json({
        isGameCreator: false,
        hasFullAccess: false,
        permissions: null,
        message: "Usuario no tiene permisos asignados para este juego",
      });
    }

    res.json({
      isGameCreator: false,
      hasFullAccess: false,
      permissions: permissions,
    });
  } catch (error) {
    console.error("Error obteniendo permisos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Listar todos los permisos de un juego
export const getGamePermissions = async (req, res) => {
  try {
    const gameId = Number(req.params.gameId);

    const permissions = await prisma.userGamePermissions.findMany({
      where: { gameId: gameId },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ permissions });
  } catch (error) {
    console.error("Error obteniendo permisos del juego:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar permisos de un usuario
export const removePermissions = async (req, res) => {
  try {
    const gameId = Number(req.params.gameId);
    const targetUserId = Number(req.params.userId);
    const requesterId = req.user.id;

    // Verificar permisos del solicitante
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { createdBy: true },
    });

    if (!game) {
      return res.status(404).json({ error: "Juego no encontrado" });
    }

    if (game.createdBy !== requesterId && req.user.rol !== "ADMIN") {
      return res.status(403).json({
        error: "Solo el creador del juego puede eliminar permisos",
      });
    }

    await prisma.userGamePermissions.delete({
      where: {
        gameId_userId: {
          gameId: gameId,
          userId: targetUserId,
        },
      },
    });

    res.json({ message: "Permisos eliminados exitosamente" });
  } catch (error) {
    console.error("Error eliminando permisos:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Permisos no encontrados" });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
