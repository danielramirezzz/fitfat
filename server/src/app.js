import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { db } from './db.js';
import { calcularRacha, fechaLocal, mejorRacha, registrarActividad, sumarDias } from './racha.js';
import { armarRutina, nivelDe, nombreGrupo, PUNTOS_RUTINA } from './rutinas.js';
import { buscarAlimentos, COMIDAS, guardarAlimentosPropios, META_AGUA, MOMENTOS, planDelDia, PUNTOS_COMIDA } from './comida.js';
import { asegurarPesoInicial, calcularLogros, cambioPeso, estadisticas, lunesDe, progresoSemanal, registrarPeso } from './progreso.js';
import {
  alertasActivas,
  generarNotificaciones,
  notificar,
  guardarConfig,
  leerConfig,
  listarNotificaciones,
  noLeidas,
  PUNTOS_ALERTAS,
  revisarLogros,
} from './alertas.js';
import { crearHash, nuevoToken, verificarContrasena } from './seguridad.js';
import { buscarCuenta, cambiarConToken, crearCodigo, cuentaGoogle, verificarCodigo } from './cuentas.js';
import { correoConfigurado, enviarCodigo } from './correo.js';
import { guardarPremium, leerPremium, mensajePremium, textoRecordatorio } from './motivacion.js';
import { googleConfigurado, verificarTokenGoogle } from './google.js';

// Points given when an account is created ("+100 puntos de bienvenida").
export const PUNTOS_BIENVENIDA = 100;

const GENEROS = ['Hombre', 'Mujer', 'Otro'];
const OBJETIVOS = ['Perder peso', 'Ganar músculo', 'Mantenerme'];

export const app = express();
app.use(cors());
app.use(express.json({ limit: '20kb' }));

// --- Helpers -----------------------------------------------------------------

// Public data of a user (never the hash or the salt).
function publico(u) {
  return {
    id: u.id,
    usuario: u.usuario,
    nombre: u.nombre,
    fechaNacimiento: u.fecha_nacimiento,
    genero: u.genero,
    estatura: u.estatura,
    peso: u.peso,
    objetivo: u.objetivo,
    correo: u.correo ?? null,
    premium: Boolean(u.premium),
    puntos: u.puntos,
    perfilCompleto: Boolean(u.nombre && u.fecha_nacimiento && u.genero && u.objetivo),
  };
}

function abrirSesion(usuarioId) {
  const token = nuevoToken();
  db.prepare('INSERT INTO sesiones (token, usuario_id) VALUES (?, ?)').run(token, usuarioId);
  return token;
}

const texto = (v) => (typeof v === 'string' ? v.trim() : '');

// Middleware: requires "Authorization: Bearer <token>" and loads req.usuario.
function requiereSesion(req, res, next) {
  const token = (req.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const u = token
    ? db.prepare('SELECT u.* FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token = ?').get(token)
    : undefined;
  if (!u) return res.status(401).json({ error: 'Tu sesión expiró. Inicia sesión de nuevo.' });
  req.usuario = u;
  req.token = token;
  next();
}

// --- Routes ------------------------------------------------------------------

app.get('/api/salud', (_req, res) => res.json({ ok: true }));

// Sign up (step 1): username + password. Returns a session token.
app.post('/api/registro', async (req, res) => {
  const usuario = texto(req.body?.usuario);
  const contrasena = typeof req.body?.contrasena === 'string' ? req.body.contrasena : '';

  if (!/^[a-zA-Z0-9_.]{3,20}$/.test(usuario)) {
    return res.status(400).json({ error: 'El usuario debe tener de 3 a 20 letras, números, punto o guion bajo.' });
  }
  if (contrasena.length < 8 || contrasena.length > 100) {
    return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres.' });
  }
  const correo = texto(req.body?.correo).toLowerCase(); // optional: used to recover the password
  if (correo && (correo.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))) {
    return res.status(400).json({ error: 'Ese correo no parece válido.', campo: 'correo' });
  }
  if (db.prepare('SELECT 1 FROM usuarios WHERE usuario = ?').get(usuario)) {
    return res.status(409).json({ error: 'Ese usuario ya existe. Prueba con otro.' });
  }

  const { hash, sal } = await crearHash(contrasena);
  const { lastInsertRowid } = db
    .prepare('INSERT INTO usuarios (usuario, hash, sal, correo, puntos) VALUES (?, ?, ?, ?, ?)')
    .run(usuario, hash, sal, correo || null, PUNTOS_BIENVENIDA);
  const u = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(lastInsertRowid);

  res.status(201).json({ token: abrirSesion(u.id), usuario: publico(u) });
});

// Sign in.
app.post('/api/login', async (req, res) => {
  const usuario = texto(req.body?.usuario);
  const contrasena = typeof req.body?.contrasena === 'string' ? req.body.contrasena : '';
  const u = usuario ? db.prepare('SELECT * FROM usuarios WHERE usuario = ?').get(usuario) : undefined;

  // Same message whether the user exists or not, so nobody can guess usernames.
  if (!u || !contrasena || !(await verificarContrasena(contrasena, u.hash, u.sal))) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }
  res.json({ token: abrirSesion(u.id), usuario: publico(u) });
});

// --- Recuperar contraseña (no session needed) ---------------------------------------------------

// Step 1: e-mail (or username) → 4-digit code, valid 10 minutes.
app.post('/api/recuperar', async (req, res) => {
  const correo = texto(req.body?.correo);
  if (!correo) return res.status(400).json({ error: 'Escribe el correo de tu cuenta.' });
  const cuenta = buscarCuenta(correo);
  if (!cuenta) return res.status(404).json({ error: 'No encontramos una cuenta con ese correo o usuario.' });
  if (!correoConfigurado()) {
    const r = crearCodigo(correo); // demo mode: the app shows the code
    return res.json({ destino: r.destino, codigoDemo: r.codigo });
  }
  if (!cuenta.correo) {
    return res.status(400).json({
      error: 'Esta cuenta no tiene un correo guardado, así que no podemos enviarte el código. Pídele ayuda al equipo de FitFat.',
    });
  }
  const r = crearCodigo(correo);
  try {
    await enviarCodigo(cuenta.correo, r.codigo, cuenta.nombre);
  } catch (e) {
    console.error('[FitFat] No se pudo enviar el correo:', e.message);
    return res.status(502).json({ error: 'No pudimos enviar el correo. Inténtalo de nuevo en un momento.' });
  }
  res.json({ destino: r.destino });
});

// Step 2: check the code → short-lived token for step 3.
app.post('/api/recuperar/verificar', (req, res) => {
  const r = verificarCodigo(texto(req.body?.correo), texto(req.body?.codigo));
  if (r.error) return res.status(r.estado).json({ error: r.error });
  res.json({ token: r.token });
});

// Step 3: new password (min. 8 characters and one number). Signs out every device.
app.post('/api/recuperar/nueva', async (req, res) => {
  const nueva = typeof req.body?.contrasena === 'string' ? req.body.contrasena : '';
  const r = await cambiarConToken(texto(req.body?.token), nueva);
  if (r.error) return res.status(r.estado).json({ error: r.error });
  res.json({ ok: true });
});

// --- Configuración pública (what the app needs to know) -------------------------------------------
app.get('/api/config', (_req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? null, // public by design (it is in the web page)
    correoReal: correoConfigurado(),
  });
});

// --- Continuar con Google ---------------------------------------------------------------------------
// Real: the app sends the ID token from Google's button; we verify it with Google.
app.post('/api/google', async (req, res) => {
  if (!googleConfigurado()) return res.status(404).json({ error: 'Falta configurar Google en el servidor.' });
  const datos = await verificarTokenGoogle(req.body?.credencial);
  if (!datos) return res.status(401).json({ error: 'Google no pudo confirmar tu cuenta. Inténtalo de nuevo.' });
  const { usuario, nueva } = await cuentaGoogle({ ...datos, nombre: datos.nombre ?? datos.correo.split('@')[0] });
  res.status(nueva ? 201 : 200).json({ token: abrirSesion(usuario.id), usuario: publico(usuario), nueva });
});

// Demo (only while GOOGLE_CLIENT_ID is not configured): name + e-mail typed in the app.
app.post('/api/google/demo', async (req, res) => {
  if (googleConfigurado()) return res.status(404).json({ error: 'Usa el botón de Google.' });
  const nombre = texto(req.body?.nombre);
  const correo = texto(req.body?.correo).toLowerCase();
  if (nombre.length < 3 || nombre.length > 80) return res.status(400).json({ error: 'Escribe tu nombre.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 120) {
    return res.status(400).json({ error: 'Escribe un correo válido.' });
  }
  const { usuario, nueva } = await cuentaGoogle({ nombre, correo });
  res.status(nueva ? 201 : 200).json({ token: abrirSesion(usuario.id), usuario: publico(usuario), nueva });
});

// Current user (used to restore a saved session when the app opens).
app.get('/api/yo', requiereSesion, (req, res) => res.json({ usuario: publico(req.usuario) }));

// Sign up (step 2): personal data.
app.put('/api/perfil', requiereSesion, (req, res) => {
  const b = req.body ?? {};
  const nombre = texto(b.nombre);
  const fecha = texto(b.fechaNacimiento);
  const estatura = Number(b.estatura);
  const peso = Number(b.peso);

  const errores = [];
  if (nombre.length < 3 || nombre.length > 80) errores.push('nombre');
  const d = new Date(`${fecha}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== fecha) {
    errores.push('fechaNacimiento');
  }
  if (!GENEROS.includes(b.genero)) errores.push('genero');
  if (!Number.isInteger(estatura) || estatura < 140 || estatura > 210) errores.push('estatura');
  if (!Number.isInteger(peso) || peso < 40 || peso > 150) errores.push('peso');
  if (!OBJETIVOS.includes(b.objetivo)) errores.push('objetivo');
  if (errores.length) return res.status(400).json({ error: 'Revisa tus datos.', campos: errores });

  db.prepare(
    `UPDATE usuarios SET nombre = ?, fecha_nacimiento = ?, genero = ?, estatura = ?, peso = ?, objetivo = ?
     WHERE id = ?`,
  ).run(nombre, fecha, b.genero, estatura, peso, b.objetivo, req.usuario.id);
  registrarPeso(req.usuario.id, peso); // first point of the weight history

  const u = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.usuario.id);
  res.json({ usuario: publico(u) });
});

// Data for the Home screen: user, streak and the summary of each card.
// Meals, alerts and weight are filled in by later steps; for now they are real
// but empty (0 meals, 0 alerts, no weight change yet).
app.get('/api/inicio', requiereSesion, (req, res) => {
  const id = req.usuario.id;
  asegurarPesoInicial(req.usuario);
  generarNotificaciones(req.usuario);
  const lunes = lunesDe(fechaLocal());
  const cambio = cambioPeso(id, lunes, sumarDias(lunes, 6));
  res.json({
    usuario: publico(req.usuario),
    racha: calcularRacha(id),
    comidas: { hoy: comidasRegistradas(id, fechaLocal()).size, meta: COMIDAS.length },
    alertasActivas: alertasActivas(id),
    notificacionesNoLeidas: noLeidas(id),
    cambioPesoKg: cambio ? cambio : null, // weight change this week (hidden if none)
  });
});

// --- Routines ----------------------------------------------------------------

// Social proof for "Grupo muscular": the group most trained today by everyone.
app.get('/api/rutinas/resumen', requiereSesion, (_req, res) => {
  const fila = db
    .prepare(
      `SELECT detalle, COUNT(*) AS n FROM actividad
       WHERE tipo = 'rutina' AND fecha = ? AND detalle IS NOT NULL
       GROUP BY detalle ORDER BY n DESC LIMIT 1`,
    )
    .get(fechaLocal());
  res.json({ masEntrenadoHoy: nombreGrupo(fila?.detalle) });
});

// The routine for a group and time, e.g. /api/rutinas/piernas?minutos=30
app.get('/api/rutinas/:grupo', requiereSesion, (req, res) => {
  const rutina = armarRutina(req.params.grupo, Number(req.query.minutos ?? 30));
  if (!rutina) return res.status(404).json({ error: 'Esa rutina no existe.' });
  res.json(rutina);
});

// Finish a routine: +50 points, streak and level.
app.post('/api/rutinas/completar', requiereSesion, (req, res) => {
  const rutina = armarRutina(req.body?.grupo, Number(req.body?.minutos));
  if (!rutina) return res.status(400).json({ error: 'Rutina inválida.' });

  const id = req.usuario.id;
  const recordAnterior = mejorRacha(id);
  registrarActividad(id, 'rutina', PUNTOS_RUTINA, fechaLocal(), rutina.grupo, rutina.minutos);

  const racha = calcularRacha(id);
  const u = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
  revisarLogros(u);
  res.json({
    puntosGanados: PUNTOS_RUTINA,
    minutos: rutina.minutos,
    ejercicios: rutina.ejercicios.length,
    calorias: rutina.calorias,
    racha: { dias: racha.dias, record: racha.dias > recordAnterior && racha.dias > 1, recordAnterior },
    nivel: nivelDe(u.puntos),
    usuario: publico(u),
  });
});

// --- Food & habits -------------------------------------------------------------

// Set of meals (desayuno, almuerzo...) with at least one food on that date.
function comidasRegistradas(usuarioId, fecha) {
  return new Set(
    db
      .prepare('SELECT DISTINCT comida FROM comidas_registro WHERE usuario_id = ? AND fecha = ?')
      .all(usuarioId, fecha)
      .map((f) => f.comida),
  );
}

function habitosDe(usuarioId, fecha) {
  const h = db.prepare('SELECT agua, sueno, ejercicio FROM habitos WHERE usuario_id = ? AND fecha = ?').get(usuarioId, fecha);
  // If not saved yet, "exercise" starts on when a routine was completed that day.
  const hizoRutina = !!db
    .prepare("SELECT 1 FROM actividad WHERE usuario_id = ? AND fecha = ? AND tipo = 'rutina'")
    .get(usuarioId, fecha);
  return h ? { agua: h.agua, sueno: h.sueno, ejercicio: !!h.ejercicio } : { agua: 0, sueno: 0, ejercicio: hizoRutina };
}

// Food search for the "Busca un alimento" box.
app.get('/api/alimentos', requiereSesion, (req, res) => {
  res.json({ resultados: buscarAlimentos(String(req.query.q ?? ''), req.usuario.id) });
});

// Today's log: foods of each meal + habits.
app.get('/api/comida/hoy', requiereSesion, (req, res) => {
  const id = req.usuario.id;
  const hoy = fechaLocal();
  const comidas = Object.fromEntries(COMIDAS.map((c) => [c, []]));
  for (const f of db
    .prepare('SELECT comida, alimento, porcion, categoria FROM comidas_registro WHERE usuario_id = ? AND fecha = ? ORDER BY id')
    .all(id, hoy)) {
    comidas[f.comida]?.push({ nombre: f.alimento, porcion: f.porcion, categoria: f.categoria });
  }
  res.json({ fecha: hoy, comidas, habitos: habitosDe(id, hoy), metaAgua: META_AGUA });
});

// "Guardar registro": saves the foods of one meal and today's habits.
// +20 points the first time each meal is logged in the day.
app.post('/api/comida/registro', requiereSesion, (req, res) => {
  const id = req.usuario.id;
  const hoy = fechaLocal();
  const { comida, alimentos = [], habitos = {} } = req.body ?? {};

  if (!COMIDAS.includes(comida)) return res.status(400).json({ error: 'Comida inválida.' });
  if (!Array.isArray(alimentos) || alimentos.length > 20) return res.status(400).json({ error: 'Lista de alimentos inválida.' });
  const lista = alimentos
    .map((a) => ({
      nombre: texto(a?.nombre).slice(0, 60),
      porcion: texto(a?.porcion).slice(0, 30) || '1 porción',
      categoria: ['cereal', 'proteina', 'verdura', 'fruta'].includes(a?.categoria) ? a.categoria : 'otro',
    }))
    .filter((a) => a.nombre);
  const agua = Math.min(20, Math.max(0, Math.round(Number(habitos.agua) || 0)));
  const sueno = Math.min(16, Math.max(0, Math.round((Number(habitos.sueno) || 0) * 2) / 2)); // half hours
  const ejercicio = habitos.ejercicio ? 1 : 0;

  if (!lista.length && !agua && !sueno && !ejercicio) {
    return res.status(400).json({ error: 'Agrega al menos un alimento o un hábito.' });
  }

  const rachaAntes = calcularRacha(id).dias;
  const yaTeniaComida = comidasRegistradas(id, hoy).has(comida);
  const yaActivoHoy = calcularRacha(id).hoyActivo;

  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM comidas_registro WHERE usuario_id = ? AND fecha = ? AND comida = ?').run(id, hoy, comida);
    const ins = db.prepare(
      'INSERT INTO comidas_registro (usuario_id, fecha, comida, alimento, porcion, categoria) VALUES (?, ?, ?, ?, ?, ?)',
    );
    for (const a of lista) ins.run(id, hoy, comida, a.nombre, a.porcion, a.categoria);
    guardarAlimentosPropios(id, lista);
    db.prepare(
      `INSERT INTO habitos (usuario_id, fecha, agua, sueno, ejercicio) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (usuario_id, fecha) DO UPDATE SET agua = excluded.agua, sueno = excluded.sueno, ejercicio = excluded.ejercicio`,
    ).run(id, hoy, agua, sueno, ejercicio);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  // Points only for a meal logged for the first time today; any log keeps the streak alive.
  let puntosGanados = 0;
  if (lista.length && !yaTeniaComida) {
    registrarActividad(id, 'comida', PUNTOS_COMIDA, hoy, comida);
    puntosGanados = PUNTOS_COMIDA;
  } else if (!yaActivoHoy) {
    registrarActividad(id, 'habitos', 0, hoy);
  }

  const u = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
  revisarLogros(u);
  res.json({
    puntosGanados,
    racha: { antes: rachaAntes, ahora: calcularRacha(id).dias },
    comidasHoy: comidasRegistradas(id, hoy).size,
    usuario: publico(u),
  });
});

const DIAS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

// Meal plan: this week (Mon–Sun) and the 4 meals of the chosen day.
app.get('/api/comida/plan', requiereSesion, (req, res) => {
  const id = req.usuario.id;
  const hoy = fechaLocal();
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.fecha)) ? String(req.query.fecha) : hoy;

  const [y, m, d] = hoy.split('-').map(Number);
  const hoyDate = new Date(y, m - 1, d);
  const lunes = new Date(y, m - 1, d - ((hoyDate.getDay() + 6) % 7));
  const semana = Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i);
    const f = fechaLocal(dia);
    return { fecha: f, dia: DIAS[dia.getDay()], numero: dia.getDate(), hoy: f === hoy, futuro: f > hoy, registrado: comidasRegistradas(id, f).size > 0 };
  });

  const hechas = comidasRegistradas(id, fecha);
  const hora = new Date().getHours() + new Date().getMinutes() / 60;
  const comidas = planDelDia(fecha, req.usuario.objetivo).map((c, i) => ({
    ...c,
    hecho: hechas.has(c.registro),
    // "AHORA": the moment whose time window contains the current hour (only today).
    ahora: fecha === hoy && hora < c.hasta && (i === 0 || hora >= MOMENTOS[i - 1].hasta),
  }));

  res.json({
    objetivo: req.usuario.objetivo,
    fecha,
    semana,
    comidas,
    hechas: comidas.filter((c) => c.hecho).length,
    total: comidas.length,
  });
});

// --- Progress ----------------------------------------------------------------------

// "Progreso semanal": minutes per day, workouts, weight change and level.
// ?offset=-1 is last week, -2 the one before, etc.
app.get('/api/progreso/semana', requiereSesion, (req, res) => {
  asegurarPesoInicial(req.usuario);
  const offset = Math.min(0, Math.max(-52, Math.trunc(Number(req.query.offset) || 0)));
  res.json(progresoSemanal(req.usuario, offset));
});

// "Estadísticas": weight chart, achievements and summary for semana | mes | ano.
app.get('/api/progreso/estadisticas', requiereSesion, (req, res) => {
  asegurarPesoInicial(req.usuario);
  const periodo = ['semana', 'mes', 'ano'].includes(req.query.periodo) ? req.query.periodo : 'semana';
  res.json(estadisticas(req.usuario, periodo));
});

// Record today's weight.
app.post('/api/peso', requiereSesion, (req, res) => {
  const kg = Math.round(Number(req.body?.kg) * 10) / 10;
  if (!Number.isFinite(kg) || kg < 30 || kg > 250) return res.status(400).json({ error: 'Escribe un peso entre 30 y 250 kg.' });
  asegurarPesoInicial(req.usuario);
  registrarPeso(req.usuario.id, kg);
  res.json({ ok: true, kg });
});

// --- Alerts & notifications ----------------------------------------------------------

app.get('/api/alertas', requiereSesion, (req, res) => res.json(leerConfig(req.usuario.id)));

// Save reminder settings. +10 points the first time.
app.put('/api/alertas', requiereSesion, (req, res) => {
  const id = req.usuario.id;
  const primeraVez = !leerConfig(id).guardada;
  const error = guardarConfig(id, req.body);
  if (error) return res.status(400).json({ error });
  if (primeraVez) db.prepare('UPDATE usuarios SET puntos = puntos + ? WHERE id = ?').run(PUNTOS_ALERTAS, id);
  const u = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
  res.json({ config: leerConfig(id), puntosGanados: primeraVez ? PUNTOS_ALERTAS : 0, usuario: publico(u) });
});

app.get('/api/notificaciones', requiereSesion, (req, res) => {
  generarNotificaciones(req.usuario);
  res.json({ notificaciones: listarNotificaciones(req.usuario.id), noLeidas: noLeidas(req.usuario.id) });
});

app.post('/api/notificaciones/leidas', requiereSesion, (req, res) => {
  db.prepare('UPDATE notificaciones SET leida = 1 WHERE usuario_id = ?').run(req.usuario.id);
  res.json({ ok: true });
});

// --- Profile -------------------------------------------------------------------------

// "Mi perfil" + "Mis logros": everything in one call.
app.get('/api/perfil/resumen', requiereSesion, (req, res) => {
  const u = req.usuario;
  asegurarPesoInicial(u);
  const primero = db.prepare('SELECT fecha FROM pesos WHERE usuario_id = ? ORDER BY fecha LIMIT 1').get(u.id);
  const logros = calcularLogros(u);
  const alertas = leerConfig(u.id);
  res.json({
    usuario: publico(u),
    nivel: nivelDe(u.puntos),
    racha: calcularRacha(u.id).dias,
    rutinas: db.prepare("SELECT COUNT(*) AS n FROM actividad WHERE usuario_id = ? AND tipo = 'rutina'").get(u.id).n,
    cambioPesoKg: primero ? cambioPeso(u.id, primero.fecha, fechaLocal()) : null, // since the first weigh-in
    logros: { ...logros, proximo: logros.lista.find((l) => !l.desbloqueado)?.nombre ?? null },
    notificacionesNoLeidas: noLeidas(u.id),
    recordatorio: { activo: alertasActivas(u.id) > 0, hora: alertas.hora, frecuencia: alertas.frecuencia },
  });
});

// "Editar perfil": name, email, weight (kg, decimals allowed), height (cm) and goal.
app.put('/api/perfil/editar', requiereSesion, (req, res) => {
  const b = req.body ?? {};
  const nombre = texto(b.nombre);
  const correo = texto(b.correo).toLowerCase();
  const peso = Math.round(Number(b.peso) * 10) / 10;
  const estatura = Math.round(Number(b.estatura));

  const errores = [];
  if (nombre.length < 3 || nombre.length > 80) errores.push('nombre');
  if (correo && (correo.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))) errores.push('correo');
  if (!Number.isFinite(peso) || peso < 30 || peso > 250) errores.push('peso');
  if (!Number.isFinite(estatura) || estatura < 120 || estatura > 230) errores.push('estatura');
  if (!OBJETIVOS.includes(b.objetivo)) errores.push('objetivo');
  if (errores.length) return res.status(400).json({ error: 'Revisa los datos marcados.', campos: errores });

  const id = req.usuario.id;
  db.prepare('UPDATE usuarios SET nombre = ?, correo = ?, peso = ?, estatura = ?, objetivo = ? WHERE id = ?').run(
    nombre,
    correo || null,
    peso,
    estatura,
    b.objetivo,
    id,
  );
  if (peso !== req.usuario.peso) registrarPeso(id, peso); // also goes to the weight history
  res.json({ usuario: publico(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id)) });
});

// "Cambiar contraseña" (Ajustes). Signs out every other device.
app.put('/api/contrasena', requiereSesion, async (req, res) => {
  const actual = typeof req.body?.actual === 'string' ? req.body.actual : '';
  const nueva = typeof req.body?.nueva === 'string' ? req.body.nueva : '';
  const u = req.usuario;
  if (!(await verificarContrasena(actual, u.hash, u.sal))) {
    return res.status(401).json({ error: 'Tu contraseña actual no es correcta.', campo: 'actual' });
  }
  if (nueva.length < 8 || nueva.length > 100) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener mínimo 8 caracteres.', campo: 'nueva' });
  }
  if (nueva === actual) {
    return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la actual.', campo: 'nueva' });
  }
  const { hash, sal } = await crearHash(nueva);
  db.prepare('UPDATE usuarios SET hash = ?, sal = ? WHERE id = ?').run(hash, sal, u.id);
  db.prepare('DELETE FROM sesiones WHERE usuario_id = ? AND token != ?').run(u.id, req.token);
  res.json({ ok: true });
});

// --- Reminders that fire on the device (web and phone) ---------------------------------------
// The app calls this at the chosen time; we write the personalized text and keep it in
// the inbox (Notificaciones), once per type, day and time.
app.post('/api/avisos/disparar', requiereSesion, (req, res) => {
  const u = req.usuario;
  const tipo = texto(req.body?.tipo);
  const hora = /^([01]\d|2[0-3]):[0-5]\d$/.test(req.body?.hora) ? req.body.hora : 'ahora';
  const prueba = Boolean(req.body?.prueba);
  let mensaje;
  if (tipo === 'premium') {
    if (!u.premium) return res.status(403).json({ error: 'Los mensajes motivacionales son de FitFat Premium.' });
    mensaje = mensajePremium(u);
  } else if (['entrenamiento', 'agua', 'comidas', 'dormir', 'pesaje', 'motivacion'].includes(tipo)) {
    mensaje = textoRecordatorio(u, tipo);
  } else {
    return res.status(400).json({ error: 'Tipo de aviso inválido.' });
  }
  const clave = prueba ? `prueba-${Date.now()}` : `aviso-${fechaLocal()}-${tipo}-${hora}`;
  notificar(u.id, clave, tipo === 'premium' ? 'motivacion' : tipo, mensaje.titulo, mensaje.cuerpo);
  res.json({ ...mensaje, noLeidas: noLeidas(u.id) });
});

// --- FitFat Premium ---------------------------------------------------------------------------
app.get('/api/premium', requiereSesion, (req, res) => res.json(leerPremium(req.usuario)));

app.put('/api/premium', requiereSesion, (req, res) => {
  const error = guardarPremium(req.usuario.id, req.body);
  if (error) return res.status(400).json({ error });
  const u = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.usuario.id);
  res.json({ ...leerPremium(u), usuario: publico(u) });
});

// Sign out: deletes this session's token.
app.post('/api/logout', requiereSesion, (req, res) => {
  db.prepare('DELETE FROM sesiones WHERE token = ?').run(req.token);
  res.json({ ok: true });
});

// --- The app itself (production) ------------------------------------------------------------
// After `npm run build` (in the project root) the web version of the app is in app/dist.
// This same server delivers it, so app and /api share one https address (no ports, no Wi-Fi).
const carpetaWeb = process.env.FITFAT_WEB_DIR ?? fileURLToPath(new URL('../../app/dist', import.meta.url));
if (existsSync(join(carpetaWeb, 'index.html'))) {
  app.use(
    express.static(carpetaWeb, {
      index: false,
      // Files with a hash in the name never change → cache for a year.
      setHeaders: (res, ruta) => {
        if (ruta.includes(`${sep}_expo${sep}`) || ruta.includes(`${sep}assets${sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );
  // Any other page (/login, /inicio, /perfil/logros...) → the app decides what to show.
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(join(carpetaWeb, 'index.html'));
  });
}

// Unknown route / unexpected error → JSON instead of an HTML page.
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
  console.error(err);
  res.status(500).json({ error: 'Error del servidor.' });
});
