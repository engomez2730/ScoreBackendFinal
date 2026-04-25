import substitutionsRouter from "./routes/substitutions.js";
import playerGameStatsRouter from "./routes/playerGameStats.js";
import gamesRouter from "./routes/games.js";
import authRouter from "./routes/auth.js";
import userGameRouter from "./routes/userGame.js";
import usersRouter from "./routes/users.js";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import playersRouter from "./routes/players.js";
import teamsRouter from "./routes/teams.js";
import eventsRouter from "./routes/events.js";
import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// API Routes with /api prefix
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/user-game", userGameRouter);
app.use("/api/players", playersRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/games", gamesRouter);
app.use("/api/player-game-stats", playerGameStatsRouter);
app.use("/api/substitutions", substitutionsRouter);

app.get("/api", (req, res) => {
  res.send("Basketball Stats API running");
});

// --- Lógica de control de tiempo y sincronización en tiempo real ---
let gameTimers = {}; // { [gameId]: { running: bool, time: ms, lastStart: timestamp } }

const JWT_SECRET = process.env.JWT_SECRET || "basketball-stats-secret-key";

// Middleware de autenticación para Socket.IO
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      // Permitir conexiones sin token para mantener compatibilidad
      socket.user = null;
      return next();
    }

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

    if (user && user.isActive) {
      socket.user = user;
    } else {
      socket.user = null;
    }

    next();
  } catch (error) {
    // Si hay error en el token, permitir conexión sin usuario
    socket.user = null;
    next();
  }
};

io.use(authenticateSocket);

io.on("connection", (socket) => {
  console.log(
    "Usuario conectado:",
    socket.id,
    socket.user ? `(${socket.user.nombre})` : "(sin autenticar)"
  );

  // Unirse a una sala de juego específica
  socket.on("joinGame", async (gameId) => {
    socket.join(`game_${gameId}`);

    // Si el usuario está autenticado, actualizar su sesión
    if (socket.user) {
      try {
        await prisma.gameSession.upsert({
          where: {
            gameId_userId: {
              gameId: Number(gameId),
              userId: socket.user.id,
            },
          },
          update: {
            socketId: socket.id,
            isActive: true,
            leftAt: null,
          },
          create: {
            gameId: Number(gameId),
            userId: socket.user.id,
            socketId: socket.id,
            isActive: true,
          },
        });

        // Notificar a otros usuarios de la sala que alguien se unió
        socket.to(`game_${gameId}`).emit("userJoined", {
          user: socket.user,
          socketId: socket.id,
        });
      } catch (error) {
        console.error("Error actualizando sesión del usuario:", error);
      }
    }
  });

  // Verificar permisos antes de permitir control del tiempo
  const checkTimeControlPermission = async (gameId, userId) => {
    if (!userId) return false; // Sin usuario autenticado = sin permisos

    try {
      const game = await prisma.game.findUnique({
        where: { id: Number(gameId) },
        select: { createdBy: true },
      });

      // Si es el creador del juego, tiene permisos
      if (game.createdBy === userId) return true;

      // Verificar permisos específicos
      const permissions = await prisma.userGamePermissions.findUnique({
        where: {
          gameId_userId: {
            gameId: Number(gameId),
            userId: userId,
          },
        },
      });

      return permissions?.canControlTime || false;
    } catch (error) {
      console.error("Error verificando permisos:", error);
      return false;
    }
  };

  // Control del reloj del juego (PROTEGIDO)
  socket.on("startTimer", async (gameId) => {
    // Verificar permisos de control de tiempo
    if (!socket.user) {
      socket.emit("error", {
        message: "Debes estar autenticado para controlar el tiempo",
      });
      return;
    }

    const hasPermission = await checkTimeControlPermission(
      gameId,
      socket.user.id
    );
    if (!hasPermission) {
      socket.emit("error", {
        message: "No tienes permisos para controlar el tiempo de este juego",
        type: "INSUFFICIENT_PERMISSIONS",
      });
      return;
    }
    if (!gameTimers[gameId])
      gameTimers[gameId] = { running: false, time: 0, lastStart: null };
    if (!gameTimers[gameId].running) {
      gameTimers[gameId].running = true;
      gameTimers[gameId].lastStart = Date.now();
      io.to(`game_${gameId}`).emit("clockStarted", {
        gameId,
        time: gameTimers[gameId].time,
        startedBy: socket.user.nombre,
      });
    }
  });

  socket.on("pauseClock", async (gameId) => {
    // Verificar permisos de control de tiempo
    if (!socket.user) {
      socket.emit("error", {
        message: "Debes estar autenticado para controlar el tiempo",
      });
      return;
    }

    const hasPermission = await checkTimeControlPermission(
      gameId,
      socket.user.id
    );
    if (!hasPermission) {
      socket.emit("error", {
        message: "No tienes permisos para pausar el tiempo de este juego",
        type: "INSUFFICIENT_PERMISSIONS",
      });
      return;
    }

    const timer = gameTimers[gameId];
    if (timer && timer.running) {
      timer.time += Date.now() - timer.lastStart;
      timer.running = false;
      io.to(`game_${gameId}`).emit("clockPaused", {
        gameId,
        time: timer.time,
        pausedBy: socket.user.nombre,
      });
    }
  });

  socket.on("resetClock", async (gameId) => {
    // Verificar permisos de control de tiempo
    if (!socket.user) {
      socket.emit("error", {
        message: "Debes estar autenticado para reiniciar el tiempo",
      });
      return;
    }

    const hasPermission = await checkTimeControlPermission(
      gameId,
      socket.user.id
    );
    if (!hasPermission) {
      socket.emit("error", {
        message: "No tienes permisos para reiniciar el tiempo de este juego",
        type: "INSUFFICIENT_PERMISSIONS",
      });
      return;
    }

    gameTimers[gameId] = { running: false, time: 0, lastStart: null };
    io.to(`game_${gameId}`).emit("clockReset", {
      gameId,
      resetBy: socket.user.nombre,
    });
  });

  // Verificar permisos para estadísticas
  const checkStatsPermission = async (gameId, userId, statType) => {
    if (!userId) return false;

    try {
      const game = await prisma.game.findUnique({
        where: { id: Number(gameId) },
        select: { createdBy: true },
      });

      if (game.createdBy === userId) return true;

      const permissions = await prisma.userGamePermissions.findUnique({
        where: {
          gameId_userId: {
            gameId: Number(gameId),
            userId: userId,
          },
        },
      });

      if (!permissions) return false;

      // Verificar permisos específicos según el tipo de estadística
      switch (statType) {
        case "points":
          return permissions.canEditPoints;
        case "rebounds":
          return permissions.canEditRebounds;
        case "assists":
          return permissions.canEditAssists;
        case "steals":
          return permissions.canEditSteals;
        case "blocks":
          return permissions.canEditBlocks;
        case "turnovers":
          return permissions.canEditTurnovers;
        case "shots":
          return permissions.canEditShots;
        case "freeThrows":
          return permissions.canEditFreeThrows;
        case "fouls":
          return permissions.canEditPersonalFouls;
        default:
          return false;
      }
    } catch (error) {
      console.error("Error verificando permisos de estadísticas:", error);
      return false;
    }
  };

  // Sincronización de estadísticas en tiempo real (PROTEGIDO)
  socket.on("updateStats", async (data) => {
    // data: { gameId, playerId, stats, statType }
    if (!socket.user) {
      socket.emit("error", {
        message: "Debes estar autenticado para actualizar estadísticas",
      });
      return;
    }

    const hasPermission = await checkStatsPermission(
      data.gameId,
      socket.user.id,
      data.statType
    );
    if (!hasPermission) {
      socket.emit("error", {
        message: `No tienes permisos para editar ${data.statType} en este juego`,
        type: "INSUFFICIENT_PERMISSIONS",
      });
      return;
    }

    // Agregar información del usuario que hizo el cambio
    const enhancedData = {
      ...data,
      updatedBy: socket.user.nombre,
      timestamp: new Date(),
    };

    io.to(`game_${data.gameId}`).emit("statsUpdated", enhancedData);
  });

  // Verificar permisos para sustituciones
  const checkSubstitutionPermission = async (gameId, userId) => {
    if (!userId) return false;

    try {
      const game = await prisma.game.findUnique({
        where: { id: Number(gameId) },
        select: { createdBy: true },
      });

      if (game.createdBy === userId) return true;

      const permissions = await prisma.userGamePermissions.findUnique({
        where: {
          gameId_userId: {
            gameId: Number(gameId),
            userId: userId,
          },
        },
      });

      return permissions?.canMakeSubstitutions || false;
    } catch (error) {
      console.error("Error verificando permisos de sustitución:", error);
      return false;
    }
  };

  socket.on("substitution", async (data) => {
    // data: { gameId, playerInId, playerOutId, timestamp }
    if (!socket.user) {
      socket.emit("error", {
        message: "Debes estar autenticado para hacer sustituciones",
      });
      return;
    }

    const hasPermission = await checkSubstitutionPermission(
      data.gameId,
      socket.user.id
    );
    if (!hasPermission) {
      socket.emit("error", {
        message: "No tienes permisos para hacer sustituciones en este juego",
        type: "INSUFFICIENT_PERMISSIONS",
      });
      return;
    }

    const enhancedData = {
      ...data,
      madeBy: socket.user.nombre,
      timestamp: new Date(),
    };

    io.to(`game_${data.gameId}`).emit("substitutionMade", enhancedData);
  });

  socket.on("disconnect", async () => {
    console.log(
      "Usuario desconectado:",
      socket.id,
      socket.user ? `(${socket.user.nombre})` : "(sin autenticar)"
    );

    // Marcar sesiones del usuario como inactivas
    if (socket.user) {
      try {
        await prisma.gameSession.updateMany({
          where: {
            userId: socket.user.id,
            socketId: socket.id,
            isActive: true,
          },
          data: {
            isActive: false,
            leftAt: new Date(),
            socketId: null,
          },
        });
      } catch (error) {
        console.error("Error actualizando sesiones al desconectar:", error);
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
