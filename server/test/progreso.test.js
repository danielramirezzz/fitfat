import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

process.env.FITFAT_DB = ':memory:';
const { app } = await import('../src/app.js');
const { db } = await import('../src/db.js');
const { fechaLocal, sumarDias } = await import('../src/racha.js');
const { lunesDe, registrarPeso } = await import('../src/progreso.js');

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

async function cuentaConPerfil(usuario) {
  const { datos } = await llamar('POST', '/registro', { usuario, contrasena: 'clave-segura-1' });
  await llamar(
    'PUT',
    '/perfil',
    { nombre: 'Persona Prueba', fechaNacimiento: '2001-05-05', genero: 'Otro', estatura: 170, peso: 80, objetivo: 'Perder peso' },
    datos.token,
  );
  return datos;
}

test('lunesDe devuelve el lunes de la semana', () => {
  assert.equal(lunesDe('2026-11-09'), '2026-11-09'); // Monday
  assert.equal(lunesDe('2026-11-15'), '2026-11-09'); // Sunday
});

test('progreso semanal: minutos por día y entrenos', async () => {
  const { token } = await cuentaConPerfil('progre_1');
  await llamar('POST', '/rutinas/completar', { grupo: 'piernas', minutos: 30 }, token);
  await llamar('POST', '/rutinas/completar', { grupo: 'brazos', minutos: 15 }, token);

  const { datos } = await llamar('GET', '/progreso/semana', null, token);
  assert.equal(datos.dias.length, 7);
  assert.equal(datos.dias.find((d) => d.hoy).minutos, 45);
  assert.equal(datos.minutos, 45);
  assert.equal(datos.entrenos, 1); // two routines, same day
  assert.equal(datos.metaMinutos, 150);
  assert.equal(datos.nivel.puntos, 200); // 100 welcome + 2 × 50

  const pasada = await llamar('GET', '/progreso/semana?offset=-1', null, token);
  assert.equal(pasada.datos.minutos, 0);
  assert.equal(pasada.datos.actual, false);
});

test('peso: historial, cambio de la semana y estadísticas', async () => {
  const { token, usuario } = await cuentaConPerfil('progre_2');
  // Weight before this week, then today's weight.
  db.prepare('DELETE FROM pesos WHERE usuario_id = ?').run(usuario.id);
  registrarPeso(usuario.id, 80, sumarDias(lunesDe(fechaLocal()), -3));
  assert.equal((await llamar('POST', '/peso', { kg: 10 }, token)).estado, 400);
  assert.equal((await llamar('POST', '/peso', { kg: 79.4 }, token)).estado, 200);

  const semana = await llamar('GET', '/progreso/semana', null, token);
  assert.equal(semana.datos.cambioPeso, -0.6);

  const inicio = await llamar('GET', '/inicio', null, token);
  assert.equal(inicio.datos.cambioPesoKg, -0.6);

  const est = await llamar('GET', '/progreso/estadisticas?periodo=semana', null, token);
  assert.equal(est.datos.pesoActual, 79.4);
  assert.equal(est.datos.puntos.length, 7);
  assert.equal(est.datos.cambio, -0.6);
  assert.equal(est.datos.logros.total, 12);
  assert.equal(est.datos.logros.lista[0].desbloqueado, true); // "Primer paso"

  const ano = await llamar('GET', '/progreso/estadisticas?periodo=ano', null, token);
  assert.equal(ano.datos.puntos.length, 12);
});
