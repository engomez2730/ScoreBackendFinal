import prisma from "../lib/prisma.js";
import { syncEfficiency } from "../lib/efficiency.js";
import {
  HttpError,
  parseBoxScore,
  consistencyErrors,
  toBoxScore,
  toStatsColumns,
  mergeBoxScore,
  changedFields,
  quarterBucketUpdates,
} from "../lib/manualStats.js";

const MAX_REASON_LENGTH = 500;

// Overwrites a player's consolidated PlayerGameStats row with a manually
// corrected box score and moves the team's score by the resulting change in
// points, all in one transaction. Works for live and finished games.
//
// The score is adjusted by delta rather than recomputed as the sum of every
// player's puntos: homeScore/awayScore are maintained incrementally by
// recordShot and can also be set directly via PUT /games/:id/score, so a full
// recompute would silently discard those manual score fixes.
export const adjustPlayerStats = async ({
  gameId,
  playerId,
  stats,
  baseline,
  reason,
  userId,
}) => {
  const submitted = parseBoxScore(stats, "stats");
  const submittedErrors = consistencyErrors(submitted, stats);
  if (submittedErrors.length) {
    throw new HttpError(422, "Las estadísticas no son coherentes", {
      errors: submittedErrors,
    });
  }
  const base = baseline == null ? null : parseBoxScore(baseline, "baseline");

  if (reason != null && typeof reason !== "string") {
    throw new HttpError(422, "El motivo debe ser texto");
  }
  const cleanReason = reason?.trim().slice(0, MAX_REASON_LENGTH) || null;

  return prisma.$transaction(
    async (tx) => {
      const game = await tx.game.findUnique({
        where: { id: gameId },
        select: {
          id: true,
          estado: true,
          teamHomeId: true,
          teamAwayId: true,
          currentQuarter: true,
          isOvertime: true,
        },
      });
      if (!game) throw new HttpError(404, "Juego no encontrado");
      if (game.estado === "scheduled") {
        throw new HttpError(
          409,
          "El juego aún no ha comenzado; no hay estadísticas que corregir"
        );
      }

      const player = await tx.player.findUnique({
        where: { id: playerId },
        select: { id: true, nombre: true, apellido: true, numero: true, teamId: true },
      });
      if (!player) throw new HttpError(404, "Jugador no encontrado");
      const isHome = player.teamId === game.teamHomeId;
      if (!isHome && player.teamId !== game.teamAwayId) {
        throw new HttpError(422, "El jugador no pertenece a ninguno de los equipos de este juego");
      }

      // Row lock: a live recordShot/recordRebound on this player waits for us
      // instead of landing between our read and our write and being lost.
      await tx.$queryRaw`
        SELECT id FROM "PlayerGameStats"
        WHERE "gameId" = ${gameId} AND "playerId" = ${playerId}
        FOR UPDATE`;
      const existing = await tx.playerGameStats.findUnique({
        where: { gameId_playerId: { gameId, playerId } },
      });

      const current = toBoxScore(existing);
      const { merged, conflicts } = mergeBoxScore(current, submitted, base);
      if (conflicts.length) {
        throw new HttpError(
          409,
          "Las estadísticas de este jugador cambiaron mientras las editabas",
          { conflicts, current }
        );
      }
      const mergedErrors = consistencyErrors(merged);
      if (mergedErrors.length) {
        throw new HttpError(
          409,
          "Tu corrección ya no es coherente con jugadas registradas mientras editabas",
          { errors: mergedErrors, current }
        );
      }

      const changed = changedFields(current, merged);
      const columns = toStatsColumns(merged);
      const pointsDelta = columns.puntos - (existing?.puntos ?? 0);
      // Still write when only puntos was out of step with the shot columns
      // (rows edited through older endpoints), so the formula always holds.
      if (changed.length === 0 && pointsDelta === 0) {
        return { changed: [], pointsDelta: 0, stats: existing, game: null, player };
      }

      const foulsDelta = columns.faltasPersonales - (existing?.faltasPersonales ?? 0);
      const data = {
        ...columns,
        ...quarterBucketUpdates(existing, pointsDelta, foulsDelta, game),
      };
      const saved = await syncEfficiency(
        tx,
        await tx.playerGameStats.upsert({
          where: { gameId_playerId: { gameId, playerId } },
          update: data,
          create: { gameId, playerId, ...data },
        })
      );

      const scoreField = isHome ? "homeScore" : "awayScore";
      const updatedGame = await tx.game.update({
        where: { id: gameId },
        data: pointsDelta !== 0 ? { [scoreField]: { increment: pointsDelta } } : {},
        select: { id: true, estado: true, homeScore: true, awayScore: true },
      });
      if (updatedGame[scoreField] < 0) {
        throw new HttpError(
          422,
          "La corrección dejaría el marcador del equipo en negativo"
        );
      }

      await tx.playerStatsAdjustment.create({
        data: {
          gameId,
          playerId,
          userId,
          reason: cleanReason,
          gameState: game.estado,
          before: current,
          after: merged,
          pointsDelta,
        },
      });

      return { changed, pointsDelta, stats: saved, game: updatedGame, player };
    },
    { timeout: 10000 }
  );
};

export const getAdjustmentHistory = async (gameId, playerId) =>
  prisma.playerStatsAdjustment.findMany({
    where: { gameId, ...(playerId ? { playerId } : {}) },
    orderBy: { createdAt: "desc" },
  });
