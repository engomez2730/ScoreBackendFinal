// One-off backfill: recalculates the FIBA efficiency (eficiencia) column for
// every existing PlayerGameStats row. Safe to re-run.
// Usage: npx prisma db push && node scripts/backfill-efficiency.js
import prisma from "../src/lib/prisma.js";

const updated = await prisma.$executeRaw`
  UPDATE "PlayerGameStats"
  SET "eficiencia" =
      ("puntos" + "rebotes" + "asistencias" + "robos" + "tapones")
    - ("tirosIntentados" - "tirosAnotados")
    - ("tirosLibresIntentados" - "tirosLibresAnotados")
    - "perdidas"
`;
console.log(`Eficiencia recalculada en ${updated} registros.`);
await prisma.$disconnect();
