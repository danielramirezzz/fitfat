import { db } from './db.js';

// Day helpers. We use the PC's local date (Colombia) so "today" matches the user's day.
export function fechaLocal(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

export function sumarDias(fecha, n) {
  const [y, m, d] = fecha.split('-').map(Number);
  return fechaLocal(new Date(y, m - 1, d + n));
}

const LETRAS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; // Sunday = 0

// Records an action (e.g. a finished routine) and adds its points to the user.
export function registrarActividad(usuarioId, tipo, puntos = 0, fecha = fechaLocal(), detalle = null, minutos = 0) {
  db.prepare('INSERT INTO actividad (usuario_id, fecha, tipo, puntos, detalle, minutos) VALUES (?, ?, ?, ?, ?, ?)').run(
    usuarioId,
    fecha,
    tipo,
    puntos,
    detalle,
    minutos,
  );
  if (puntos) db.prepare('UPDATE usuarios SET puntos = puntos + ? WHERE id = ?').run(puntos, usuarioId);
}

// Longest streak the user ever had, counting only days before `antesDe`.
// Used to say "Superaste tu récord personal".
export function mejorRacha(usuarioId, antesDe = fechaLocal()) {
  const fechas = db
    .prepare('SELECT DISTINCT fecha FROM actividad WHERE usuario_id = ? AND fecha < ? ORDER BY fecha')
    .all(usuarioId, antesDe)
    .map((f) => f.fecha);
  let mejor = 0;
  let actual = 0;
  let anterior = null;
  for (const f of fechas) {
    actual = anterior && sumarDias(anterior, 1) === f ? actual + 1 : 1;
    mejor = Math.max(mejor, actual);
    anterior = f;
  }
  return mejor;
}

// Streak = consecutive active days ending today, or ending yesterday if the
// user has not been active yet today (so the fire does not go out in the morning).
export function calcularRacha(usuarioId, hoy = fechaLocal()) {
  const dias = new Set(
    db
      .prepare('SELECT DISTINCT fecha FROM actividad WHERE usuario_id = ? AND fecha <= ?')
      .all(usuarioId, hoy)
      .map((f) => f.fecha),
  );

  const hoyActivo = dias.has(hoy);
  let dia = hoyActivo ? hoy : sumarDias(hoy, -1);
  let racha = 0;
  while (dias.has(dia)) {
    racha++;
    dia = sumarDias(dia, -1);
  }

  // Last 6 days + today, oldest first (the "L M X J V S HOY" row).
  const semana = [];
  for (let i = -6; i <= 0; i++) {
    const fecha = sumarDias(hoy, i);
    const [y, m, d] = fecha.split('-').map(Number);
    semana.push({
      fecha,
      letra: i === 0 ? 'HOY' : LETRAS[new Date(y, m - 1, d).getDay()],
      activo: dias.has(fecha),
      hoy: i === 0,
    });
  }

  return { dias: racha, hoyActivo, semana };
}
