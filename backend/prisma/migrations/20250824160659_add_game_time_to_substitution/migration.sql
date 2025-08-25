/*
  Warnings:

  - Added the required column `gameTime` to the `Substitution` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Substitution" ADD COLUMN     "gameTime" INTEGER NOT NULL;
