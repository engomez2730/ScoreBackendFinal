// Manual box-score corrections for one player in one game.
//
// The editor works with "primitive" fields — 2PT and 3PT split, offensive and
// defensive rebounds split — while PlayerGameStats stores derived columns
// (tirosIntentados/tirosAnotados already include 3-pointers, rebotes is the
// total, puntos is the sum). Everything is converted through here so a manual
// edit can never leave puntos, field goals or rebotes out of step with their
// components.

// Same FIBA disqualification limit recordPersonalFoul enforces live.
export const FOUL_OUT_LIMIT = 5;

// Editable fields with their allowed range. minutos is in seconds, the same
// unit PlayerGameStats.minutos uses; plusMinus is the only signed metric.
export const BOX_SCORE_FIELDS = {
  tirosLibresAnotados: { min: 0, max: 999 },
  tirosLibresIntentados: { min: 0, max: 999 },
  tiros2Anotados: { min: 0, max: 999 },
  tiros2Intentados: { min: 0, max: 999 },
  tiros3Anotados: { min: 0, max: 999 },
  tiros3Intentados: { min: 0, max: 999 },
  rebotesOfensivos: { min: 0, max: 999 },
  rebotesDefensivos: { min: 0, max: 999 },
  asistencias: { min: 0, max: 999 },
  robos: { min: 0, max: 999 },
  tapones: { min: 0, max: 999 },
  perdidas: { min: 0, max: 999 },
  faltasPersonales: { min: 0, max: FOUL_OUT_LIMIT },
  minutos: { min: 0, max: 6 * 60 * 60 },
  plusMinus: { min: -999, max: 999 },
};

const FIELDS = Object.keys(BOX_SCORE_FIELDS);

// Derived totals a client may echo back; if present they must agree.
const DERIVED_FIELDS = ["puntos", "rebotes"];

const SHOT_PAIRS = [
  ["tirosLibresAnotados", "tirosLibresIntentados", "tiros libres"],
  ["tiros2Anotados", "tiros2Intentados", "tiros de 2"],
  ["tiros3Anotados", "tiros3Intentados", "tiros de 3"],
];

const POINT_BUCKETS = ["puntosQ1", "puntosQ2", "puntosQ3", "puntosQ4", "puntosOT"];
const FOUL_BUCKETS = ["faltasQ1", "faltasQ2", "faltasQ3", "faltasQ4", "faltasOT"];

export class HttpError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const computePoints = (b) =>
  b.tirosLibresAnotados + 2 * b.tiros2Anotados + 3 * b.tiros3Anotados;

// PlayerGameStats row (or null when the player has none yet) -> box score
export const toBoxScore = (row) => {
  const v = (field) => row?.[field] ?? 0;
  return {
    tirosLibresAnotados: v("tirosLibresAnotados"),
    tirosLibresIntentados: v("tirosLibresIntentados"),
    tiros2Anotados: v("tirosAnotados") - v("tiros3Anotados"),
    tiros2Intentados: v("tirosIntentados") - v("tiros3Intentados"),
    tiros3Anotados: v("tiros3Anotados"),
    tiros3Intentados: v("tiros3Intentados"),
    rebotesOfensivos: v("rebotesOfensivos"),
    rebotesDefensivos: v("rebotes") - v("rebotesOfensivos"),
    asistencias: v("asistencias"),
    robos: v("robos"),
    tapones: v("tapones"),
    perdidas: v("perdidas"),
    faltasPersonales: v("faltasPersonales"),
    minutos: v("minutos"),
    plusMinus: v("plusMinus"),
  };
};

// Box score -> PlayerGameStats columns
export const toStatsColumns = (b) => ({
  puntos: computePoints(b),
  tirosIntentados: b.tiros2Intentados + b.tiros3Intentados,
  tirosAnotados: b.tiros2Anotados + b.tiros3Anotados,
  tiros3Intentados: b.tiros3Intentados,
  tiros3Anotados: b.tiros3Anotados,
  tirosLibresIntentados: b.tirosLibresIntentados,
  tirosLibresAnotados: b.tirosLibresAnotados,
  rebotes: b.rebotesOfensivos + b.rebotesDefensivos,
  rebotesOfensivos: b.rebotesOfensivos,
  asistencias: b.asistencias,
  robos: b.robos,
  tapones: b.tapones,
  perdidas: b.perdidas,
  faltasPersonales: b.faltasPersonales,
  minutos: b.minutos,
  plusMinus: b.plusMinus,
});

// Validates a client payload and returns it as a clean box score.
// Throws HttpError(422) listing every invalid field at once.
export const parseBoxScore = (input, label) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(422, `"${label}" debe ser un objeto con las estadísticas`);
  }

  const errors = [];
  const box = {};
  for (const [field, { min, max }] of Object.entries(BOX_SCORE_FIELDS)) {
    const value = input[field];
    if (!Number.isInteger(value)) {
      errors.push({ field, message: "Debe ser un número entero" });
    } else if (value < min) {
      errors.push({
        field,
        message: min === 0 ? "No puede ser negativo" : `Debe ser ≥ ${min}`,
      });
    } else if (value > max) {
      errors.push({ field, message: `Debe ser ≤ ${max}` });
    } else {
      box[field] = value;
    }
  }

  for (const field of Object.keys(input)) {
    if (!FIELDS.includes(field) && !DERIVED_FIELDS.includes(field)) {
      errors.push({ field, message: "Campo no editable" });
    }
  }

  if (errors.length) {
    throw new HttpError(422, `Estadísticas inválidas en "${label}"`, { errors });
  }
  return box;
};

// Rules that involve more than one field. Returns a list, empty when valid.
export const consistencyErrors = (box, echoed = {}) => {
  const errors = [];
  for (const [made, attempted, name] of SHOT_PAIRS) {
    if (box[made] > box[attempted]) {
      errors.push({
        field: made,
        message: `Los ${name} convertidos (${box[made]}) no pueden superar los intentados (${box[attempted]})`,
      });
    }
  }

  const puntos = computePoints(box);
  if (echoed.puntos !== undefined && echoed.puntos !== puntos) {
    errors.push({
      field: "puntos",
      message: `Los puntos (${echoed.puntos}) no coinciden con TL + 2·T2 + 3·T3 = ${puntos}`,
    });
  }
  const rebotes = box.rebotesOfensivos + box.rebotesDefensivos;
  if (echoed.rebotes !== undefined && echoed.rebotes !== rebotes) {
    errors.push({
      field: "rebotes",
      message: `El total de rebotes (${echoed.rebotes}) no coincide con ofensivos + defensivos = ${rebotes}`,
    });
  }
  return errors;
};

// Three-way merge so a correction made during a live game doesn't wipe out
// plays other scorers recorded after the editor opened the form. A field is
// taken from `submitted` only if the editor actually changed it from
// `baseline` (what they were shown); if the server value also moved since
// then, to something else, that is a real conflict. Without a baseline the
// submission simply overwrites everything.
export const mergeBoxScore = (current, submitted, baseline) => {
  if (!baseline) return { merged: { ...submitted }, conflicts: [] };

  const merged = {};
  const conflicts = [];
  for (const field of FIELDS) {
    if (submitted[field] === baseline[field]) {
      merged[field] = current[field];
      continue;
    }
    if (current[field] !== baseline[field] && current[field] !== submitted[field]) {
      conflicts.push({
        field,
        base: baseline[field],
        yours: submitted[field],
        current: current[field],
      });
    }
    merged[field] = submitted[field];
  }
  return { merged, conflicts };
};

export const changedFields = (before, after) =>
  FIELDS.filter((field) => before[field] !== after[field]);

// Index into the Q1..Q4/OT buckets for the quarter the game is in now, or
// ended in — nextQuarter leaves currentQuarter on the last one played.
export const currentBucketIndex = (game) =>
  game.isOvertime ? 4 : Math.min(Math.max(game.currentQuarter ?? 1, 1), 4) - 1;

// The per-quarter columns must keep adding up to the total they break down,
// but there is no play-by-play log saying which quarter a corrected basket or
// foul belonged to. Additions go to the current (or final) quarter; removals
// are taken from that quarter backwards, then forwards, until covered.
const redistribute = (row, buckets, delta, fromIndex) => {
  const updates = {};
  if (delta > 0) {
    updates[buckets[fromIndex]] = (row[buckets[fromIndex]] ?? 0) + delta;
    return updates;
  }

  let remaining = -delta;
  const order = [
    ...Array.from({ length: fromIndex + 1 }, (_, i) => fromIndex - i),
    ...Array.from({ length: buckets.length - fromIndex - 1 }, (_, i) => fromIndex + 1 + i),
  ];
  for (const i of order) {
    if (remaining === 0) break;
    const available = row[buckets[i]] ?? 0;
    const taken = Math.min(available, remaining);
    if (taken > 0) {
      updates[buckets[i]] = available - taken;
      remaining -= taken;
    }
  }
  return updates;
};

export const quarterBucketUpdates = (row, pointsDelta, foulsDelta, game) => {
  const from = currentBucketIndex(game);
  return {
    ...redistribute(row ?? {}, POINT_BUCKETS, pointsDelta, from),
    ...redistribute(row ?? {}, FOUL_BUCKETS, foulsDelta, from),
  };
};
