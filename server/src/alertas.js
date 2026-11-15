import { db } from './db.js';
import { calcularLogros, cambioPeso, lunesDe, progresoSemanal } from './progreso.js';
import { calcularRacha, fechaLocal, sumarDias } from './racha.js';
import { grupos, nombreGrupo } from './rutinas.js';

export const TIPOS_ALERTA = ['entrenamiento', 'agua', 'comidas', 'dormir', 'pesaje', 'motivacion'];
export const FRECUENCIAS = ['diaria', 'semana', 'fines'];
export const PUNTOS_ALERTAS = 10;

// --- Settings ----------------------------------------------------------------------

export function leerConfig(usuarioId) {
  const c = db.prepare('SELECT * FROM alertas_config WHERE usuario_id = ?').get(usuarioId);
  if (!c) {
    return { push: true, correo: false, sms: false, tipos: ['entrenamiento', 'agua'], hora: '07:00', frecuencia: 'diaria', guardada: false };
  }
  return {
    push: !!c.push,
    correo: !!c.correo,
    sms: !!c.sms,
    tipos: JSON.parse(c.tipos),
    hora: c.hora,
    frecuencia: c.frecuencia,
    guardada: true,
  };
}

// Validates and saves. Returns the error message, or '' if OK.
export function guardarConfig(usuarioId, b) {
  const tipos = Array.isArray(b?.tipos) ? [...new Set(b.tipos)].filter((t) => TIPOS_ALERTA.includes(t)) : null;
  if (!tipos) return 'Tipos de alerta inválidos.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(b.hora))) return 'Hora inválida.';
  if (!FRECUENCIAS.includes(b.frecuencia)) return 'Frecuencia inválida.';
  db.prepare(
    `INSERT INTO alertas_config (usuario_id, push, correo, sms, tipos, hora, frecuencia) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (usuario_id) DO UPDATE SET push = excluded.push, correo = excluded.correo, sms = excluded.sms,
       tipos = excluded.tipos, hora = excluded.hora, frecuencia = excluded.frecuencia`,
  ).run(usuarioId, b.push ? 1 : 0, b.correo ? 1 : 0, b.sms ? 1 : 0, JSON.stringify(tipos), b.hora, b.frecuencia);
  return '';
}

// Active reminders = chosen types, only if at least one channel is on.
export function alertasActivas(usuarioId) {
  const c = leerConfig(usuarioId);
  return c.push || c.correo || c.sms ? c.tipos.length : 0;
}

// --- Notifications -----------------------------------------------------------------

export function notificar(usuarioId, clave, tipo, titulo, cuerpo) {
  db.prepare(
    'INSERT OR IGNORE INTO notificaciones (usuario_id, clave, tipo, titulo, cuerpo) VALUES (?, ?, ?, ?, ?)',
  ).run(usuarioId, clave, tipo, titulo, cuerpo);
}

// Saves newly unlocked achievements and announces them. The first time it runs
// for a user it only records the existing ones (no flood of old notifications).
export function revisarLogros(usuario) {
  const id = usuario.id;
  const yaGuardados = new Set(
    db.prepare('SELECT clave FROM logros_usuario WHERE usuario_id = ?').all(id).map((f) => f.clave),
  );
  const primeraVez = yaGuardados.size === 0;
  const hoy = fechaLocal();
  for (const l of calcularLogros(usuario).lista) {
    if (!l.desbloqueado || yaGuardados.has(l.clave)) continue;
    db.prepare('INSERT INTO logros_usuario (usuario_id, clave, fecha) VALUES (?, ?, ?)').run(id, l.clave, hoy);
    if (!primeraVez) {
      notificar(id, `logro-${l.clave}`, 'logro', '¡Nuevo logro desbloqueado!', `${l.nombre}: ${l.descripcion.toLowerCase()}.`);
    }
  }
}

// Creates the notifications that apply right now (each one only once thanks to `clave`).
export function generarNotificaciones(usuario, ahora = new Date()) {
  const id = usuario.id;
  const hoy = fechaLocal(ahora);
  const hora = ahora.getHours();
  const tipos = new Set(leerConfig(id).tipos);
  revisarLogros(usuario);

  const racha = calcularRacha(id, hoy);
  if (tipos.has('entrenamiento') && racha.dias > 0 && !racha.hoyActivo && hora >= 12) {
    notificar(id, `racha-${hoy}`, 'racha', '¡Tu racha está en peligro!', `Entrena hoy para mantener tus ${racha.dias} ${racha.dias === 1 ? 'día' : 'días'}.`);
  }

  if (tipos.has('agua') && hora >= 10) {
    const agua = db.prepare('SELECT agua FROM habitos WHERE usuario_id = ? AND fecha = ?').get(id, hoy)?.agua ?? 0;
    if (agua < 8) {
      notificar(id, `agua-${hoy}`, 'agua', 'Hora de tomar agua', agua ? `Llevas ${agua} de 8 vasos. ¡Ya casi!` : 'Aún no registras agua hoy. ¡Empieza con un vaso!');
    }
  }

  if (tipos.has('comidas') && hora >= 13) {
    const comidas = db.prepare('SELECT COUNT(DISTINCT comida) AS n FROM comidas_registro WHERE usuario_id = ? AND fecha = ?').get(id, hoy).n;
    if (comidas === 0) notificar(id, `comidas-${hoy}`, 'comida', '¿Ya registraste tus comidas?', 'Registrar hoy mantiene viva tu racha.');
  }

  if (tipos.has('dormir') && hora >= 21) {
    notificar(id, `dormir-${hoy}`, 'dormir', 'Hora de descansar', 'Dormir 8 horas te ayuda a recuperarte mejor.');
  }

  const lunes = lunesDe(hoy);
  if (tipos.has('pesaje') && hoy === lunes) {
    notificar(id, `pesaje-${hoy}`, 'pesaje', 'Hora de pesarte', 'Registra tu peso para ver tu progreso semanal.');
  }

  if (tipos.has('entrenamiento')) {
    // Recommended routine: the group trained least in the last 7 days (once per week).
    const conteo = Object.fromEntries(Object.keys(grupos()).map((g) => [g, 0]));
    for (const f of db
      .prepare("SELECT detalle FROM actividad WHERE usuario_id = ? AND tipo = 'rutina' AND fecha > ?")
      .all(id, sumarDias(hoy, -7))) {
      if (f.detalle in conteo) conteo[f.detalle]++;
    }
    const grupo = Object.entries(conteo).sort((a, b) => a[1] - b[1])[0][0];
    notificar(id, `rutina-${lunes}`, 'rutina', 'Rutina recomendada para ti', `${nombreGrupo(grupo)} · 30 min · Principiante`);
  }

  if (tipos.has('motivacion')) {
    // Weekly summary of last week (from Monday on).
    const pasada = progresoSemanal(usuario, -1);
    const cambio = cambioPeso(id, pasada.inicio, pasada.fin);
    const peso = cambio ? `${cambio < 0 ? 'Bajaste' : 'Subiste'} ${Math.abs(cambio).toFixed(1).replace('.', ',')} kg y entrenaste` : 'Entrenaste';
    notificar(id, `resumen-${lunes}`, 'resumen', 'Tu resumen semanal está listo', `${peso} ${pasada.minutos} min.`);
  }
}

export function listarNotificaciones(usuarioId) {
  return db
    .prepare('SELECT id, tipo, titulo, cuerpo, creada_en, leida FROM notificaciones WHERE usuario_id = ? ORDER BY creada_en DESC, id DESC LIMIT 50')
    .all(usuarioId)
    .map((n) => ({ ...n, leida: !!n.leida, creadaEn: `${n.creada_en.replace(' ', 'T')}Z` }));
}

export function noLeidas(usuarioId) {
  return db.prepare('SELECT COUNT(*) AS n FROM notificaciones WHERE usuario_id = ? AND leida = 0').get(usuarioId).n;
}
