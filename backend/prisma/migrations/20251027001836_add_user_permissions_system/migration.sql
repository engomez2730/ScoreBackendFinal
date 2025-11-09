-- AlterTable
ALTER TABLE "public"."Game" ADD COLUMN     "createdBy" INTEGER;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ALTER COLUMN "rol" SET DEFAULT 'USER';

-- CreateTable
CREATE TABLE "public"."GameSession" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "socketId" TEXT,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserGamePermissions" (
    "id" SERIAL NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,

    CONSTRAINT "UserGamePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_gameId_userId_key" ON "public"."GameSession"("gameId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserGamePermissions_gameId_userId_key" ON "public"."UserGamePermissions"("gameId", "userId");

-- AddForeignKey
ALTER TABLE "public"."GameSession" ADD CONSTRAINT "GameSession_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameSession" ADD CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserGamePermissions" ADD CONSTRAINT "UserGamePermissions_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserGamePermissions" ADD CONSTRAINT "UserGamePermissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
