import { db } from './db.js';

// Quick routines (groups and exercises live in DB tables): one per muscle group, bodyweight only (beginner).
// Each routine = 3 min warm-up + 4 exercises. The chosen time (15/30/45 min)
// changes the number of sets per exercise.

export const PUNTOS_RUTINA = 50;
export const TIEMPOS = [15, 30, 45];
const SERIES_POR_TIEMPO = { 15: 2, 30: 3, 45: 4 };

// Muscle groups from the DB: { pecho: { nombre: 'Pecho' }, ... } in display order.
export function grupos() {
  return Object.fromEntries(
    db
      .prepare('SELECT clave, nombre FROM grupos_musculares ORDER BY orden')
      .all()
      .map((g) => [g.clave, { nombre: g.nombre }]),
  );
}

export const nombreGrupo = (clave) =>
  db.prepare('SELECT nombre FROM grupos_musculares WHERE clave = ?').get(clave ?? '')?.nombre ?? null;

function ejerciciosDe(grupo) {
  return db
    .prepare('SELECT nombre, reps, segundos, detalle FROM ejercicios WHERE grupo = ? ORDER BY orden')
    .all(grupo)
    .map(({ nombre, reps, segundos, detalle }, i) => ({
      nombre,
      detalle,
      ...(reps ? { reps } : { segundos }),
      video: `${grupo}-${i + 1}`, // app/assets/videos/<grupo>-<n>.mp4 (Pexels)
    }));
}

// Builds the routine for a group and time. Returns null if the group is unknown.
export function armarRutina(grupo, minutos) {
  const nombre = nombreGrupo(grupo);
  if (!nombre || !TIEMPOS.includes(minutos)) return null;
  const g = { nombre, ejercicios: ejerciciosDe(grupo) };
  const series = SERIES_POR_TIEMPO[minutos];

  const ejercicios = [
    { nombre: 'Calentamiento', series: 1, segundos: 180, detalle: 'Movilidad articular y trote suave', video: 'calentamiento' },
    ...g.ejercicios.map((e) => ({ ...e, series })),
  ].map((e) => ({
    ...e,
    // Seconds per set: timed exercises use their own time; reps ≈ 3 s each.
    duracionSerie: e.segundos ?? e.reps * 3,
    descanso: 30,
  }));

  return {
    grupo,
    nombreGrupo: g.nombre,
    titulo: `Rutina de ${g.nombre.toLowerCase()}`,
    minutos,
    nivel: 'Principiante',
    puntos: PUNTOS_RUTINA,
    calorias: minutos * 6, // rough estimate for bodyweight training
    ejercicios,
  };
}

// Level: every 500 points is a new level (1.290 pts → level 3, next at 1.500).
export function nivelDe(puntos) {
  const nivel = Math.floor(puntos / 500) + 1;
  return { nivel, puntos, siguiente: nivel * 500 };
}
