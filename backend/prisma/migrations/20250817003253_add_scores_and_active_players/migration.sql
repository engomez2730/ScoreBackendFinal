-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "awayScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gameTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "homeScore" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "_ActivePlayers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ActivePlayers_AB_unique" ON "_ActivePlayers"("A", "B");

-- CreateIndex
CREATE INDEX "_ActivePlayers_B_index" ON "_ActivePlayers"("B");

-- AddForeignKey
ALTER TABLE "_ActivePlayers" ADD CONSTRAINT "_ActivePlayers_A_fkey" FOREIGN KEY ("A") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivePlayers" ADD CONSTRAINT "_ActivePlayers_B_fkey" FOREIGN KEY ("B") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
