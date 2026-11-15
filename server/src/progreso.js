import { db } from './db.js';
import { fechaLocal, mejorRacha, sumarDias } from './racha.js';
import { nivelDe, nombreGrupo } from './rutinas.js';

// Weekly goals (WHO recommends 150 min of activity per week).
export const META_MINUTOS = 150;
export const META_ENTRENOS = 5;

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const LETRAS_DIA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']; // Monday first
const LETRAS_MES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const partes = (f) => f.split('-').map(Number);
const min = (a, b) => (a < b ? a : b);
const redondear1 = (n) => Math.round(n * 10) / 10;

// Monday of the week of `fecha`.
export function lunesDe(fecha) {
  const [y, m, d] = partes(fecha);
  const dia = new Date(y, m - 1, d).getDay(); // 0 = Sunday
  return sumarDias(fecha, -((dia + 6) % 7));
}

// --- Weight ---------------------------------------------------------------------

// Users created before the weight history existed: use their profile weight
// as the first record (on the day they signed up).
export function asegurarPesoInicial(usuario) {
  if (!usuario.peso) return;
  const hay = db.prepare('SELECT 1 FROM pesos WHERE usuario_id = ?').get(usuario.id);
  if (!hay) {
    const fecha = String(usuario.creado_en).slice(0, 10);
    db.prepare('INSERT INTO pesos (usuario_id, fecha, kg) VALUES (?, ?, ?)').run(usuario.id, fecha, usuario.peso);
  }
}

export function registrarPeso(usuarioId, kg, fecha = fechaLocal()) {
  db.prepare(
    `INSERT INTO pesos (usuario_id, fecha, kg) VALUES (?, ?, ?)
     ON CONFLICT (usuario_id, fecha) DO UPDATE SET kg = excluded.kg`,
  ).run(usuarioId, fecha, kg);
  db.prepare('UPDATE usuarios SET peso = ? WHERE id = ?').run(kg, usuarioId); // keeps decimals (e.g. 64,4 kg)
}

// Last weight record on or before `fecha` ({ fecha, kg } or undefined).
function registroHasta(usuarioId, fecha) {
  return db
    .prepare('SELECT fecha, kg FROM pesos WHERE usuario_id = ? AND fecha <= ? ORDER BY fecha DESC LIMIT 1')
    .get(usuarioId, fecha);
}
const pesoHasta = (usuarioId, fecha) => registroHasta(usuarioId, fecha)?.kg ?? null;

// Weight change between the start and the end of a period.
// null when there are not two different records to compare.
export function cambioPeso(usuarioId, inicio, fin) {
  const hasta = min(fin, fechaLocal());
  const final = registroHasta(usuarioId, hasta);
  const base =
    registroHasta(usuarioId, sumarDias(inicio, -1)) ??
    db
      .prepare('SELECT fecha, kg FROM pesos WHERE usuario_id = ? AND fecha >= ? AND fecha <= ? ORDER BY fecha LIMIT 1')
      .get(usuarioId, inicio, hasta);
  if (!final || !base || final.fecha === base.fecha) return null;
  return redondear1(final.kg - base.kg);
}

// --- Weekly progress ----------------------------------------------------------------

export function progresoSemanal(usuario, offset = 0) {
  const id = usuario.id;
  const hoy = fechaLocal();
  const inicio = sumarDias(lunesDe(hoy), offset * 7);
  const fin = sumarDias(inicio, 6);

  const minutosPorDia = new Map(
    db
      .prepare(
        `SELECT fecha, SUM(minutos) AS m FROM actividad
         WHERE usuario_id = ? AND tipo = 'rutina' AND fecha BETWEEN ? AND ? GROUP BY fecha`,
      )
      .all(id, inicio, fin)
      .map((f) => [f.fecha, f.m]),
  );

  const dias = LETRAS_DIA.map((letra, i) => {
    const fecha = sumarDias(inicio, i);
    return { fecha, letra, minutos: minutosPorDia.get(fecha) ?? 0, hoy: fecha === hoy, futuro: fecha > hoy };
  });

  const [, mi, di] = partes(inicio);
  const [, mf, df] = partes(fin);
  return {
    inicio,
    fin,
    rango: `${di} ${MESES[mi - 1]} – ${df} ${MESES[mf - 1]}`,
    actual: offset === 0,
    dias,
    entrenos: minutosPorDia.size,
    metaEntrenos: META_ENTRENOS,
    minutos: dias.reduce((s, d) => s + d.minutos, 0),
    metaMinutos: META_MINUTOS,
    cambioPeso: cambioPeso(id, inicio, fin),
    objetivo: usuario.objetivo,
    nivel: nivelDe(usuario.puntos),
  };
}

// --- Statistics ---------------------------------------------------------------------

// Buckets (points of the weight chart) for each period.
function periodoDe(periodo, hoy) {
  const [y, m] = partes(hoy);
  if (periodo === 'mes') {
    const inicio = `${y}-${String(m).padStart(2, '0')}-01`;
    const fin = fechaLocal(new Date(y, m, 0)); // last day of the month
    const grupos = [];
    for (let i = 0, d = inicio; d <= fin; i++, d = sumarDias(d, 7)) {
      grupos.push({ etiqueta: `S${i + 1}`, inicio: d, fin: min(sumarDias(d, 6), fin) });
    }
    return { inicio, fin, grupos, texto: 'este mes' };
  }
  if (periodo === 'ano') {
    const grupos = LETRAS_MES.map((etiqueta, i) => ({
      etiqueta,
      inicio: fechaLocal(new Date(y, i, 1)),
      fin: fechaLocal(new Date(y, i + 1, 0)),
    }));
    return { inicio: `${y}-01-01`, fin: `${y}-12-31`, grupos, texto: 'este año' };
  }
  const inicio = lunesDe(hoy);
  const grupos = LETRAS_DIA.map((etiqueta, i) => {
    const d = sumarDias(inicio, i);
    return { etiqueta, inicio: d, fin: d };
  });
  return { inicio, fin: sumarDias(inicio, 6), grupos, texto: 'esta semana' };
}

// The 12 achievements. `tipo` chooses the tile style in the app.
export function calcularLogros(usuario) {
  const id = usuario.id;
  const unico = (sql) => db.prepare(sql).get(id);
  const rutinas = unico("SELECT COUNT(*) AS n FROM actividad WHERE usuario_id = ? AND tipo = 'rutina'").n;
  const mejor = mejorRacha(id, sumarDias(fechaLocal(), 1));
  const maxAgua = unico('SELECT MAX(agua) AS n FROM habitos WHERE usuario_id = ?').n ?? 0;
  const maxSueno = unico('SELECT MAX(sueno) AS n FROM habitos WHERE usuario_id = ?').n ?? 0;
  const comidas = unico('SELECT COUNT(*) AS n FROM comidas_registro WHERE usuario_id = ?').n;
  const diaCompleto =
    unico(
      `SELECT MAX(n) AS n FROM (SELECT COUNT(DISTINCT comida) AS n FROM comidas_registro
       WHERE usuario_id = ? GROUP BY fecha)`,
    ).n ?? 0;

  // Rule of each achievement (names and descriptions come from the logros table).
  const reglas = {
    'primer-paso': true,
    'racha-3': mejor >= 3,
    'racha-7': mejor >= 7,
    'racha-30': mejor >= 30,
    'rutina-1': rutinas >= 1,
    'rutina-10': rutinas >= 10,
    'rutina-50': rutinas >= 50,
    hidratado: maxAgua >= 8,
    descanso: maxSueno >= 8,
    'comida-1': comidas >= 1,
    'dia-completo': diaCompleto >= 4,
    'nivel-5': usuario.puntos >= 2000,
  };
  const lista = db
    .prepare('SELECT clave, nombre, descripcion, tipo FROM logros ORDER BY orden')
    .all()
    .map((l) => ({ ...l, desbloqueado: Boolean(reglas[l.clave]) }));

  return { total: lista.length, desbloqueados: lista.filter((l) => l.desbloqueado).length, lista };
}

export function estadisticas(usuario, periodo = 'semana') {
  const id = usuario.id;
  const hoy = fechaLocal();
  const p = periodoDe(periodo, hoy);
  const hasta = min(p.fin, hoy);

  // Weight chart: last known weight at the end of each bucket (no future points).
  const puntos = p.grupos.map((g) => ({
    etiqueta: g.etiqueta,
    kg: g.inicio <= hoy ? pesoHasta(id, min(g.fin, hoy)) : null,
  }));

  const rutinas = db
    .prepare("SELECT COUNT(*) AS n FROM actividad WHERE usuario_id = ? AND tipo = 'rutina' AND fecha BETWEEN ? AND ?")
    .get(id, p.inicio, hasta).n;
  const grupo = db
    .prepare(
      `SELECT detalle, COUNT(*) AS n FROM actividad
       WHERE usuario_id = ? AND tipo = 'rutina' AND detalle IS NOT NULL AND fecha BETWEEN ? AND ?
       GROUP BY detalle ORDER BY n DESC LIMIT 1`,
    )
    .get(id, p.inicio, hasta);
  const diasComida = db
    .prepare('SELECT COUNT(DISTINCT fecha) AS n FROM comidas_registro WHERE usuario_id = ? AND fecha BETWEEN ? AND ?')
    .get(id, p.inicio, hasta).n;
  const agua = db
    .prepare('SELECT AVG(agua) AS n FROM habitos WHERE usuario_id = ? AND agua > 0 AND fecha BETWEEN ? AND ?')
    .get(id, p.inicio, hasta).n;
  const [y1, m1, d1] = partes(p.inicio);
  const [y2, m2, d2] = partes(hasta);
  const diasPeriodo = Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000) + 1;

  return {
    periodo,
    pesoActual: pesoHasta(id, hoy),
    puntos,
    cambio: cambioPeso(id, p.inicio, p.fin),
    textoCambio: p.texto,
    objetivo: usuario.objetivo,
    logros: calcularLogros(usuario),
    resumen: {
      rutinas,
      grupo: nombreGrupo(grupo?.detalle),
      diasComida,
      diasPeriodo,
      aguaPromedio: agua ? Math.round(agua) : 0,
    },
  };
}
