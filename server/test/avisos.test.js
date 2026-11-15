import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

process.env.FITFAT_DB = ':memory:';
const { app } = await import('../src/app.js');

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

async function cuenta(usuario) {
  const { datos } = await llamar('POST', '/registro', { usuario, contrasena: 'clave-segura-1' });
  await llamar(
    'PUT',
    '/perfil',
    { nombre: 'Laura Prueba', fechaNacimiento: '2001-01-01', genero: 'Mujer', estatura: 160, peso: 58, objetivo: 'Ganar músculo' },
    datos.token,
  );
  return datos.token;
}

test('un recordatorio disparado queda en Notificaciones, una sola vez por día y hora', async () => {
  const token = await cuenta('avisos_1');
  const a = await llamar('POST', '/avisos/disparar', { tipo: 'entrenamiento', hora: '07:00' }, token);
  assert.equal(a.estado, 200);
  assert.match(a.datos.titulo, /Laura/);
  await llamar('POST', '/avisos/disparar', { tipo: 'entrenamiento', hora: '07:00' }, token); // repeated: ignored
  const { datos } = await llamar('GET', '/notificaciones', null, token);
  assert.equal(datos.notificaciones.filter((n) => n.titulo.includes('entrenar')).length, 1);
  assert.equal((await llamar('POST', '/avisos/disparar', { tipo: 'otra-cosa' }, token)).estado, 400);
});

test('Premium: los mensajes motivacionales solo llegan con Premium activo', async () => {
  const token = await cuenta('avisos_2');
  assert.equal((await llamar('POST', '/avisos/disparar', { tipo: 'premium', hora: '13:00' }, token)).estado, 403);

  const inicial = await llamar('GET', '/premium', null, token);
  assert.equal(inicial.datos.activo, false);
  assert.deepEqual(inicial.datos.horas, ['08:00', '13:00', '19:00']);

  assert.equal((await llamar('PUT', '/premium', { activo: true, horas: ['1', '2', '3', '4', '5'] }, token)).estado, 400);
  const activado = await llamar('PUT', '/premium', { activo: true, horas: ['21:00', '07:00'] }, token);
  assert.equal(activado.datos.activo, true);
  assert.deepEqual(activado.datos.horas, ['07:00', '21:00']);
  assert.equal(activado.datos.usuario.premium, true);

  const m = await llamar('POST', '/avisos/disparar', { tipo: 'premium', hora: '07:00' }, token);
  assert.equal(m.estado, 200);
  assert.ok(m.datos.titulo.length > 5 && m.datos.cuerpo.length > 5);
});
