-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" DATETIME
);

-- CreateTable
CREATE TABLE "Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "logo" TEXT
);

-- CreateTable
CREATE TABLE "Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "posicion" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "fechaInicio" DATETIME NOT NULL,
    "fechaFin" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" INTEGER NOT NULL,
    "teamHomeId" INTEGER NOT NULL,
    "teamAwayId" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "estado" TEXT NOT NULL,
    "gameTime" INTEGER NOT NULL DEFAULT 0,
    "homeScore" INTEGER NOT NULL DEFAULT 0,
    "awayScore" INTEGER NOT NULL DEFAULT 0,
    "currentQuarter" INTEGER NOT NULL DEFAULT 1,
    "quarterLength" INTEGER NOT NULL DEFAULT 720,
    "totalQuarters" INTEGER NOT NULL DEFAULT 4,
    "overtimeLength" INTEGER NOT NULL DEFAULT 300,
    "quarterTime" INTEGER NOT NULL DEFAULT 0,
    "isOvertime" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER,
    CONSTRAINT "Game_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Game_teamHomeId_fkey" FOREIGN KEY ("teamHomeId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Game_teamAwayId_fkey" FOREIGN KEY ("teamAwayId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlayerGameStats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "puntos" INTEGER NOT NULL,
    "rebotes" INTEGER NOT NULL,
    "asistencias" INTEGER NOT NULL,
    "robos" INTEGER NOT NULL,
    "tapones" INTEGER NOT NULL,
    "tirosIntentados" INTEGER NOT NULL,
    "tirosAnotados" INTEGER NOT NULL,
    "tiros3Intentados" INTEGER NOT NULL,
    "tiros3Anotados" INTEGER NOT NULL,
    "tirosLibresIntentados" INTEGER NOT NULL DEFAULT 0,
    "tirosLibresAnotados" INTEGER NOT NULL DEFAULT 0,
    "minutos" INTEGER NOT NULL,
    "plusMinus" INTEGER NOT NULL,
    "perdidas" INTEGER NOT NULL DEFAULT 0,
    "faltasPersonales" INTEGER NOT NULL DEFAULT 0,
    "faltasQ1" INTEGER NOT NULL DEFAULT 0,
    "faltasQ2" INTEGER NOT NULL DEFAULT 0,
    "faltasQ3" INTEGER NOT NULL DEFAULT 0,
    "faltasQ4" INTEGER NOT NULL DEFAULT 0,
    "faltasOT" INTEGER NOT NULL DEFAULT 0,
    "isStarter" BOOLEAN NOT NULL DEFAULT false,
    "puntosQ1" INTEGER NOT NULL DEFAULT 0,
    "puntosQ2" INTEGER NOT NULL DEFAULT 0,
    "puntosQ3" INTEGER NOT NULL DEFAULT 0,
    "puntosQ4" INTEGER NOT NULL DEFAULT 0,
    "puntosOT" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PlayerGameStats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlayerGameStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Substitution" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" INTEGER NOT NULL,
    "playerInId" INTEGER NOT NULL,
    "playerOutId" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "gameTime" INTEGER NOT NULL,
    CONSTRAINT "Substitution_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Substitution_playerInId_fkey" FOREIGN KEY ("playerInId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Substitution_playerOutId_fkey" FOREIGN KEY ("playerOutId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "socketId" TEXT,
    CONSTRAINT "GameSession_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserGamePermissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "canEditPoints" BOOLEAN NOT NULL DEFAULT false,
    "canEditRebounds" BOOLEAN NOT NULL DEFAULT false,
    "canEditAssists" BOOLEAN NOT NULL DEFAULT false,
    "canEditSteals" BOOLEAN NOT NULL DEFAULT false,
    "canEditBlocks" BOOLEAN NOT NULL DEFAULT false,
    "canEditTurnovers" BOOLEAN NOT NULL DEFAULT false,
    "canEditShots" BOOLEAN NOT NULL DEFAULT false,
    "canEditFreeThrows" BOOLEAN NOT NULL DEFAULT false,
    "canEditPersonalFouls" BOOLEAN NOT NULL DEFAULT false,
    "canControlTime" BOOLEAN NOT NULL DEFAULT false,
    "canMakeSubstitutions" BOOLEAN NOT NULL DEFAULT false,
    "canEndQuarter" BOOLEAN NOT NULL DEFAULT false,
    "canSetStarters" BOOLEAN NOT NULL DEFAULT false,
    "canManagePermissions" BOOLEAN NOT NULL DEFAULT false,
    "canViewAllStats" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" INTEGER,
    CONSTRAINT "UserGamePermissions_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserGamePermissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ActivePlayers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ActivePlayers_A_fkey" FOREIGN KEY ("A") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ActivePlayers_B_fkey" FOREIGN KEY ("B") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerGameStats_gameId_playerId_key" ON "PlayerGameStats"("gameId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_gameId_userId_key" ON "GameSession"("gameId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserGamePermissions_gameId_userId_key" ON "UserGamePermissions"("gameId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "_ActivePlayers_AB_unique" ON "_ActivePlayers"("A", "B");

-- CreateIndex
CREATE INDEX "_ActivePlayers_B_index" ON "_ActivePlayers"("B");
