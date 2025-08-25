import substitutionsRouter from "./routes/substitutions.js";
import playerGameStatsRouter from "./routes/playerGameStats.js";
import gamesRouter from "./routes/games.js";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import playersRouter from "./routes/players.js";
import teamsRouter from "./routes/teams.js";
import eventsRouter from "./routes/events.js";  

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

io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);

  // Unirse a una sala de juego específica
  socket.on("joinGame", (gameId) => {
    socket.join(`game_${gameId}`);
  });

  // Control del reloj del juego
  socket.on("startClock", (gameId) => {
    if (!gameTimers[gameId])
      gameTimers[gameId] = { running: false, time: 0, lastStart: null };
    if (!gameTimers[gameId].running) {
      gameTimers[gameId].running = true;
      gameTimers[gameId].lastStart = Date.now();
      io.to(`game_${gameId}`).emit("clockStarted", {
        gameId,
        time: gameTimers[gameId].time,
      });
    }
  });

  socket.on("pauseClock", (gameId) => {
    const timer = gameTimers[gameId];
    if (timer && timer.running) {
      timer.time += Date.now() - timer.lastStart;
      timer.running = false;
      io.to(`game_${gameId}`).emit("clockPaused", { gameId, time: timer.time });
    }
  });

  socket.on("resetClock", (gameId) => {
    gameTimers[gameId] = { running: false, time: 0, lastStart: null };
    io.to(`game_${gameId}`).emit("clockReset", { gameId });
  });

  // Sincronización de estadísticas y sustituciones en tiempo real
  socket.on("updateStats", (data) => {
    // data: { gameId, playerId, stats }
    io.to(`game_${data.gameId}`).emit("statsUpdated", data);
  });

  socket.on("substitution", (data) => {
    // data: { gameId, playerInId, playerOutId, timestamp }
    io.to(`game_${data.gameId}`).emit("substitutionMade", data);
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
