-- DropForeignKey
ALTER TABLE "public"."PlayerGameStats" DROP CONSTRAINT "PlayerGameStats_gameId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PlayerGameStats" DROP CONSTRAINT "PlayerGameStats_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Substitution" DROP CONSTRAINT "Substitution_gameId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Substitution" DROP CONSTRAINT "Substitution_playerInId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Substitution" DROP CONSTRAINT "Substitution_playerOutId_fkey";

-- AddForeignKey
ALTER TABLE "public"."PlayerGameStats" ADD CONSTRAINT "PlayerGameStats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerGameStats" ADD CONSTRAINT "PlayerGameStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Substitution" ADD CONSTRAINT "Substitution_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Substitution" ADD CONSTRAINT "Substitution_playerInId_fkey" FOREIGN KEY ("playerInId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Substitution" ADD CONSTRAINT "Substitution_playerOutId_fkey" FOREIGN KEY ("playerOutId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
