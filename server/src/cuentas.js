import { createHash, randomInt } from 'node:crypto';

import { db } from './db.js';
import { crearHash, nuevoToken } from './seguridad.js';

// --- Recuperar contraseña ---------------------------------------------------------------
// With SMTP configured (correo.js) the code goes by e-mail. Without it, demo mode:
// the code is returned to the app, which shows it on screen.

const DIEZ_MINUTOS = 10 * 60 * 1000;
const QUINCE_MINUTOS = 15 * 60 * 1000;
const MAX_INTENTOS = 5;
const sha = (t) => createHash('sha256').update(t).digest('hex');

// "daniel@gmail.com" → "d•••••@gmail.com"
export function ocultarCorreo(correo) {
  const [nombre, dominio] = correo.split('@');
  return `${nombre[0]}•••••@${dominio}`;
}

// Looks the account up by e-mail (or username) and creates a new 4-digit code.
export function buscarCuenta(identificador) {
  const id = identificador.trim().toLowerCase();
  return db.prepare('SELECT * FROM usuarios WHERE lower(correo) = ? OR lower(usuario) = ?').get(id, id) ?? null;
}

export function crearCodigo(identificador, ahora = Date.now()) {
  const u = buscarCuenta(identificador);
  if (!u) return null;
  const codigo = String(randomInt(0, 10000)).padStart(4, '0');
  db.prepare(
    `INSERT INTO recuperaciones (usuario_id, codigo_hash, expira) VALUES (?, ?, ?)
     ON CONFLICT (usuario_id) DO UPDATE SET codigo_hash = excluded.codigo_hash, expira = excluded.expira,
       intentos = 0, token = NULL, token_expira = NULL`,
  ).run(u.id, sha(codigo), ahora + DIEZ_MINUTOS);
  if (process.env.NODE_ENV !== 'production') console.log(`[FitFat] Código de recuperación para ${u.usuario}: ${codigo}`);
  return { usuario: u, codigo, destino: u.correo ? ocultarCorreo(u.correo) : `@${u.usuario}` };
}

// Checks the code. Returns { token } or { error, estado }.
export function verificarCodigo(identificador, codigo, ahora = Date.now()) {
  const id = identificador.trim().toLowerCase();
  const r = db
    .prepare(
      `SELECT r.* FROM recuperaciones r JOIN usuarios u ON u.id = r.usuario_id
       WHERE lower(u.correo) = ? OR lower(u.usuario) = ?`,
    )
    .get(id, id);
  if (!r || r.expira < ahora) return { error: 'El código expiró. Pide uno nuevo.', estado: 410 };
  if (r.intentos >= MAX_INTENTOS) return { error: 'Demasiados intentos. Pide un código nuevo.', estado: 429 };
  if (sha(String(codigo)) !== r.codigo_hash) {
    db.prepare('UPDATE recuperaciones SET intentos = intentos + 1 WHERE usuario_id = ?').run(r.usuario_id);
    const quedan = MAX_INTENTOS - r.intentos - 1;
    return { error: `Código incorrecto. ${quedan > 0 ? `Te quedan ${quedan} intentos.` : 'Pide un código nuevo.'}`, estado: 400 };
  }
  const token = nuevoToken();
  db.prepare('UPDATE recuperaciones SET token = ?, token_expira = ? WHERE usuario_id = ?').run(
    token,
    ahora + QUINCE_MINUTOS,
    r.usuario_id,
  );
  return { token };
}

// Same rules as the "Nueva contraseña" checklist in Figma.
export function errorContrasenaNueva(contrasena) {
  if (contrasena.length < 8 || contrasena.length > 100) return 'La contraseña debe tener mínimo 8 caracteres.';
  if (!/\d/.test(contrasena)) return 'La contraseña debe tener al menos un número.';
  return '';
}

// Sets the new password with the token from verificarCodigo. Signs out every device.
export async function cambiarConToken(token, nueva, ahora = Date.now()) {
  const r = token ? db.prepare('SELECT * FROM recuperaciones WHERE token = ?').get(token) : undefined;
  if (!r || r.token_expira < ahora) return { error: 'La recuperación expiró. Vuelve a empezar.', estado: 410 };
  const error = errorContrasenaNueva(nueva);
  if (error) return { error, estado: 400 };
  const { hash, sal } = await crearHash(nueva);
  db.prepare('UPDATE usuarios SET hash = ?, sal = ? WHERE id = ?').run(hash, sal, r.usuario_id);
  db.prepare('DELETE FROM recuperaciones WHERE usuario_id = ?').run(r.usuario_id);
  db.prepare('DELETE FROM sesiones WHERE usuario_id = ?').run(r.usuario_id);
  return { ok: true };
}

// --- Continuar con Google ---------------------------------------------------------------------
// Real mode (google.js) gives us a verified { sub, correo, nombre }. Demo mode (no
// GOOGLE_CLIENT_ID) trusts the name and e-mail typed in the app. Either way the account
// is a separate "google = 1" account: it never takes over an account with a password.

export async function cuentaGoogle({ sub = null, nombre, correo }) {
  const existente =
    (sub && db.prepare('SELECT * FROM usuarios WHERE google_sub = ?').get(sub)) ||
    db.prepare('SELECT * FROM usuarios WHERE google = 1 AND lower(correo) = ? AND (google_sub IS NULL OR ? IS NULL)').get(correo, sub);
  if (existente) {
    if (sub && !existente.google_sub) db.prepare('UPDATE usuarios SET google_sub = ? WHERE id = ?').run(sub, existente.id);
    return { usuario: db.prepare('SELECT * FROM usuarios WHERE id = ?').get(existente.id), nueva: false };
  }

  // Username from the e-mail: "maria.gomez@gmail.com" → "maria.gomez" (+ number if taken)
  const base = correo.split('@')[0].replace(/[^a-z0-9_.]/g, '').slice(0, 16).padEnd(3, '_');
  let usuario = base;
  for (let n = 2; db.prepare('SELECT 1 FROM usuarios WHERE usuario = ?').get(usuario); n++) usuario = `${base}${n}`;

  const { hash, sal } = await crearHash(nuevoToken()); // random password nobody knows
  const { lastInsertRowid } = db
    .prepare(
      'INSERT INTO usuarios (usuario, hash, sal, nombre, correo, google, google_sub, puntos) VALUES (?, ?, ?, ?, ?, 1, ?, 100)',
    )
    .run(usuario, hash, sal, nombre, correo, sub);
  return { usuario: db.prepare('SELECT * FROM usuarios WHERE id = ?').get(lastInsertRowid), nueva: true };
}
