import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

process.env.FITFAT_DB = ':memory:';
const { app } = await import('../src/app.js');
const { db } = await import('../src/db.js');
const { generarNotificaciones } = await import('../src/alertas.js');
const { registrarActividad, sumarDias, fechaLocal } = await import('../src/racha.js');

let base;
let servidor;
before(async () => {
  servidor = app.listen(0);
  await new Promise((r) => servidor.once('listening', r));
  base = `http://127.0.0.1:${servidor.address().port}/api`;
});
after(() => servidor.close());

async function llamar(metodo, ruta, cuerpo, token) {
  const r = await fetch(base + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  return { estado: r.status, datos: await r.json() };
}

const CONFIG = { push: true, correo: true, sms: false, tipos: ['entrenamiento', 'agua', 'pesaje'], hora: '07:30', frecuencia: 'semana' };

test('configuración de alertas: valores por defecto, validación y +10 la primera vez', async () => {
  const { datos: c } = await llamar('POST', '/registro', { usuario: 'avisos_1', contrasena: 'clave-segura-1' });
  const t = c.token;

  const def = await llamar('GET', '/alertas', null, t);
  assert.equal(def.datos.guardada, false);
  assert.deepEqual(def.datos.tipos, ['entrenamiento', 'agua']);

  assert.equal((await llamar('PUT', '/alertas', { ...CONFIG, hora: '25:00' }, t)).estado, 400);
  assert.equal((await llamar('PUT', '/alertas', { ...CONFIG, frecuencia: 'nunca' }, t)).estado, 400);

  const r1 = await llamar('PUT', '/alertas', { ...CONFIG, tipos: [...CONFIG.tipos, 'inventado'] }, t);
  assert.equal(r1.estado, 200);
  assert.equal(r1.datos.puntosGanados, 10);
  assert.deepEqual(r1.datos.config.tipos, ['entrenamiento', 'agua', 'pesaje']);
  assert.equal(r1.datos.usuario.puntos, 110);

  const r2 = await llamar('PUT', '/alertas', CONFIG, t);
  assert.equal(r2.datos.puntosGanados, 0);

  const inicio = await llamar('GET', '/inicio', null, t);
  assert.equal(inicio.datos.alertasActivas, 3);

  // All channels off → no active reminders.
  await llamar('PUT', '/alertas', { ...CONFIG, push: false, correo: false }, t);
  assert.equal((await llamar('GET', '/inicio', null, t)).datos.alertasActivas, 0);
});

test('notificaciones: racha en peligro, agua, logros nuevos y marcar leídas', async () => {
  const { datos: c } = await llamar('POST', '/registro', { usuario: 'avisos_2', contrasena: 'clave-segura-1' });
  const t = c.token;
  const u = () => db.prepare('SELECT * FROM usuarios WHERE id = ?').get(c.usuario.id);

  // First check: only records existing achievements (no notification for "Primer paso").
  generarNotificaciones(u(), new Date(2026, 10, 9, 8, 0));
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM notificaciones WHERE usuario_id = ? AND tipo = ?').get(c.usuario.id, 'logro').n, 0);

  // Active yesterday, not today, and it is 3 p.m. → streak in danger + water reminder.
  const hoy = fechaLocal();
  registrarActividad(c.usuario.id, 'rutina', 0, sumarDias(hoy, -1), 'pecho');
  const [y, m, d] = hoy.split('-').map(Number);
  generarNotificaciones(u(), new Date(y, m - 1, d, 15, 0));
  generarNotificaciones(u(), new Date(y, m - 1, d, 16, 0)); // same day: no duplicates

  const lista = await llamar('GET', '/notificaciones', null, t);
  const tipos = lista.datos.notificaciones.map((n) => n.tipo);
  assert.equal(tipos.filter((x) => x === 'racha').length, 1);
  assert.ok(tipos.includes('agua'));
  assert.ok(tipos.includes('logro'), 'first routine unlocks an achievement');
  assert.ok(lista.datos.noLeidas >= 3);

  await llamar('POST', '/notificaciones/leidas', {}, t);
  assert.equal((await llamar('GET', '/notificaciones', null, t)).datos.noLeidas, 0);
});
