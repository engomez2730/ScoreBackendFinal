// FIBA efficiency (EFF):
//   (PTS + REB + AST + STL + BLK) − (FGA − FGM) − (FTA − FTM) − TO
// tirosIntentados/tirosAnotados already include 3-pointers, so missed field
// goals are simply tirosIntentados − tirosAnotados.
export const calculateEfficiency = (s) =>
  (s.puntos ?? 0) +
  (s.rebotes ?? 0) +
  (s.asistencias ?? 0) +
  (s.robos ?? 0) +
  (s.tapones ?? 0) -
  ((s.tirosIntentados ?? 0) - (s.tirosAnotados ?? 0)) -
  ((s.tirosLibresIntentados ?? 0) - (s.tirosLibresAnotados ?? 0)) -
  (s.perdidas ?? 0);

// Persists the recalculated EFF for a stats row that was just written.
// Takes the client explicitly so it runs inside the caller's transaction
// when there is one (a separate client would block on the row lock).
export const syncEfficiency = async (client, stats) => {
  const eficiencia = calculateEfficiency(stats);
  if (stats.eficiencia === eficiencia) return stats;
  await client.playerGameStats.update({
    where: { id: stats.id },
    data: { eficiencia },
  });
  return { ...stats, eficiencia };
};
