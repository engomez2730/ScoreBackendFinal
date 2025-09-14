-- AlterTable
ALTER TABLE "public"."PlayerGameStats" ADD COLUMN     "tirosLibresAnotados" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tirosLibresIntentados" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."_ActivePlayers" ADD CONSTRAINT "_ActivePlayers_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "public"."_ActivePlayers_AB_unique";
