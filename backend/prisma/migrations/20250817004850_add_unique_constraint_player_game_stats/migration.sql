/*
  Warnings:

  - A unique constraint covering the columns `[gameId,playerId]` on the table `PlayerGameStats` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PlayerGameStats_gameId_playerId_key" ON "PlayerGameStats"("gameId", "playerId");
