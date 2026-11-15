import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

import { ALIMENTOS, GRUPOS, LOGROS } from './semillas.js';

// Where the data lives:
// - On this PC: SQLite file server/datos/fitfat.db (node:sqlite, built into Node).
// - In production (Render): Turso, SQLite in the cloud, so the data survives restarts.
//   With TURSO_DATABASE_URL + TURSO_AUTH_TOKEN we keep a local copy ("embedded replica"):
//   reads are local and fast, writes go to Turso.
// FITFAT_DB lets the tests use a separate file (or ':memory:').
// FITFAT_DRIVER=libsql uses the Turso library with a local file (to test it without the cloud).
const carpeta = join(dirname(fileURLToPath(import.meta.url)), '..', 'datos');
const turso = process.env.TURSO_DATABASE_URL;
const ruta = process.env.FITFAT_DB ?? (turso ? join(tmpdir(), 'fitfat-replica.db') : join(carpeta, 'fitfat.db'));
if (ruta !== ':memory:') mkdirSync(dirname(ruta), { recursive: true });

function abrir() {
  if (!turso && process.env.FITFAT_DRIVER !== 'libsql') return new DatabaseSync(ruta);
  const Database = createRequire(import.meta.url)('libsql');
  if (!turso) return new Database(ruta);
  const replica = new Database(ruta, { syncUrl: turso, authToken: process.env.TURSO_AUTH_TOKEN ?? '' });
  replica.sync(); // bring the latest data from Turso before answering anything
  console.log('[FitFat] Base de datos: Turso (réplica local sincronizada)');
  return replica;
}

export const db = abrir();

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS usuarios (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario          TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    hash             TEXT    NOT NULL,          -- scrypt(password, salt)
    sal              TEXT    NOT NULL,
    nombre           TEXT,
    fecha_nacimiento TEXT,                      -- YYYY-MM-DD
    genero           TEXT,
    estatura         INTEGER,                   -- cm
    peso             INTEGER,                   -- kg
    objetivo         TEXT,
    puntos           INTEGER NOT NULL DEFAULT 0,
    creado_en        TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- One row per completed action (routine, meal log, ...). Feeds the streak.
  CREATE TABLE IF NOT EXISTS actividad (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha      TEXT    NOT NULL,                -- local day, YYYY-MM-DD
    tipo       TEXT    NOT NULL,                -- 'rutina', 'comida', ...
    puntos     INTEGER NOT NULL DEFAULT 0,
    creado_en  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS actividad_usuario_fecha ON actividad (usuario_id, fecha);

  -- Foods logged per meal and day ("Registro de alimentos").
  CREATE TABLE IF NOT EXISTS comidas_registro (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha      TEXT    NOT NULL,                -- YYYY-MM-DD
    comida     TEXT    NOT NULL,                -- desayuno | almuerzo | cena | snack
    alimento   TEXT    NOT NULL,
    porcion    TEXT    NOT NULL,
    categoria  TEXT    NOT NULL                 -- cereal | proteina | verdura | fruta | otro
  );
  CREATE INDEX IF NOT EXISTS comidas_usuario_fecha ON comidas_registro (usuario_id, fecha);

  -- Daily habits: water glasses, hours of sleep, did exercise.
  CREATE TABLE IF NOT EXISTS habitos (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha      TEXT    NOT NULL,
    agua       INTEGER NOT NULL DEFAULT 0,
    sueno      REAL    NOT NULL DEFAULT 0,
    ejercicio  INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (usuario_id, fecha)
  );

  -- Weight history (one value per day). The first one comes from "Datos".
  CREATE TABLE IF NOT EXISTS pesos (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha      TEXT    NOT NULL,
    kg         REAL    NOT NULL,
    PRIMARY KEY (usuario_id, fecha)
  );

  -- Reminder settings ("Recordatorios"). tipos = JSON array of alert types.
  CREATE TABLE IF NOT EXISTS alertas_config (
    usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    push       INTEGER NOT NULL DEFAULT 1,
    correo     INTEGER NOT NULL DEFAULT 0,
    sms        INTEGER NOT NULL DEFAULT 0,
    tipos      TEXT    NOT NULL DEFAULT '["entrenamiento","agua"]',
    hora       TEXT    NOT NULL DEFAULT '07:00',
    frecuencia TEXT    NOT NULL DEFAULT 'diaria'
  );

  -- In-app notifications. clave avoids creating the same one twice.
  CREATE TABLE IF NOT EXISTS notificaciones (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    clave      TEXT    NOT NULL,
    tipo       TEXT    NOT NULL,                -- racha | agua | logro | rutina | resumen | ...
    titulo     TEXT    NOT NULL,
    cuerpo     TEXT    NOT NULL,
    creada_en  TEXT    NOT NULL DEFAULT (datetime('now')),
    leida      INTEGER NOT NULL DEFAULT 0,
    UNIQUE (usuario_id, clave)
  );

  -- Achievements already unlocked (and when), to announce new ones.
  CREATE TABLE IF NOT EXISTS logros_usuario (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    clave      TEXT    NOT NULL,
    fecha      TEXT    NOT NULL,
    PRIMARY KEY (usuario_id, clave)
  );

  -- "Recuperar contraseña": one pending recovery per user.
  CREATE TABLE IF NOT EXISTS recuperaciones (
    usuario_id   INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo_hash  TEXT    NOT NULL,          -- sha256 of the 4-digit code
    expira       INTEGER NOT NULL,          -- ms timestamp (10 minutes)
    intentos     INTEGER NOT NULL DEFAULT 0,
    token        TEXT,                      -- given after a correct code, to set the new password
    token_expira INTEGER
  );

  CREATE TABLE IF NOT EXISTS sesiones (
    token      TEXT    PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    creado_en  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// Columns added after the first version (simple migration for existing databases).
const columnasUsuarios = db.prepare('PRAGMA table_info(usuarios)').all().map((c) => c.name);
if (!columnasUsuarios.includes('google_sub')) {
  db.exec('ALTER TABLE usuarios ADD COLUMN google_sub TEXT'); // Google's id for the person (real sign-in)
}
if (!columnasUsuarios.includes('google')) {
  db.exec('ALTER TABLE usuarios ADD COLUMN google INTEGER NOT NULL DEFAULT 0'); // account created with "Continuar con Google"
}
if (!columnasUsuarios.includes('correo')) {
  db.exec('ALTER TABLE usuarios ADD COLUMN correo TEXT'); // optional, shown in "Editar perfil"
}
const columnasActividad = db.prepare('PRAGMA table_info(actividad)').all().map((c) => c.name);
if (!columnasActividad.includes('detalle')) {
  db.exec('ALTER TABLE actividad ADD COLUMN detalle TEXT'); // e.g. the muscle group of a routine
}
if (!columnasActividad.includes('minutos')) {
  db.exec('ALTER TABLE actividad ADD COLUMN minutos INTEGER NOT NULL DEFAULT 0'); // length of a routine
}

// Older versions rounded usuarios.peso; use the latest real weigh-in (keeps decimals).
db.exec(`
  UPDATE usuarios SET peso = (SELECT kg FROM pesos p WHERE p.usuario_id = usuarios.id ORDER BY fecha DESC LIMIT 1)
  WHERE EXISTS (SELECT 1 FROM pesos p WHERE p.usuario_id = usuarios.id)
`);

// --- Catalogs (shared by everyone) ------------------------------------------------------------
db.exec(`
  -- Foods for the search box. creado_por NULL = for everyone; otherwise a food that
  -- one person typed by hand (only they see it).
  CREATE TABLE IF NOT EXISTS alimentos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre     TEXT    NOT NULL,
    porcion    TEXT    NOT NULL,
    categoria  TEXT    NOT NULL,                -- cereal | proteina | verdura | fruta | otro
    busqueda   TEXT    NOT NULL,                -- name without accents, lowercase
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    creado_en  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS alimentos_comunes ON alimentos (busqueda) WHERE creado_por IS NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS alimentos_propios ON alimentos (creado_por, busqueda) WHERE creado_por IS NOT NULL;

  CREATE TABLE IF NOT EXISTS grupos_musculares (
    clave  TEXT    PRIMARY KEY,                 -- pecho, espalda, ...
    nombre TEXT    NOT NULL,
    orden  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ejercicios (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    grupo    TEXT    NOT NULL REFERENCES grupos_musculares(clave) ON DELETE CASCADE,
    orden    INTEGER NOT NULL,
    nombre   TEXT    NOT NULL,
    reps     INTEGER,                           -- repetitions per set, or...
    segundos INTEGER,                           -- ...seconds per set
    detalle  TEXT    NOT NULL,
    UNIQUE (grupo, orden)
  );

  CREATE TABLE IF NOT EXISTS logros (
    clave       TEXT    PRIMARY KEY,
    nombre      TEXT    NOT NULL,
    descripcion TEXT    NOT NULL,
    tipo        TEXT    NOT NULL,              -- racha | rutina | agua (icon and color)
    orden       INTEGER NOT NULL
  );
`);

// Seeds: insert what is missing (never overwrites rows that already exist).
const sinTildes = (t) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
db.exec('BEGIN');
{
  const alimento = db.prepare(
    'INSERT OR IGNORE INTO alimentos (nombre, porcion, categoria, busqueda) VALUES (?, ?, ?, ?)',
  );
  for (const a of ALIMENTOS) alimento.run(a.nombre, a.porcion, a.categoria, sinTildes(a.nombre));

  const grupo = db.prepare('INSERT OR IGNORE INTO grupos_musculares (clave, nombre, orden) VALUES (?, ?, ?)');
  const ejercicio = db.prepare(
    'INSERT OR IGNORE INTO ejercicios (grupo, orden, nombre, reps, segundos, detalle) VALUES (?, ?, ?, ?, ?, ?)',
  );
  Object.entries(GRUPOS).forEach(([clave, g], i) => {
    grupo.run(clave, g.nombre, i + 1);
    g.ejercicios.forEach((e, j) => ejercicio.run(clave, j + 1, e.nombre, e.reps ?? null, e.segundos ?? null, e.detalle));
  });

  const logro = db.prepare('INSERT OR IGNORE INTO logros (clave, nombre, descripcion, tipo, orden) VALUES (?, ?, ?, ?, ?)');
  LOGROS.forEach((l, i) => logro.run(l.clave, l.nombre, l.descripcion, l.tipo, i + 1));
}
db.exec('COMMIT');
