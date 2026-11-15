import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

process.env.FITFAT_DB = ':memory:';
process.env.GOOGLE_CLIENT_ID = 'cliente-de-prueba.apps.googleusercontent.com';
const { app } = await import('../src/app.js');
const { usarVerificadorGoogle } = await import('../src/google.js');

// Fake Google: the "token" is the JSON Google would return for it.
usarVerificadorGoogle(async (t) => JSON.parse(t));
const token = (cambios = {}) =>
  JSON.stringify({
    aud: process.env.GOOGLE_CLIENT_ID,
    iss: 'https://accounts.google.com',
    exp: String(Math.floor(Date.now() / 1000) + 3600),
    email_verified: 'true',
    sub: '1234567890',
    email: 'Real.Persona@gmail.com',
    name: 'Real Persona',
    ...cambios,
  });

let base;
let servidor;
before(async () => {
  servidor = app.listen(0);
  await new Promise((r) => servidor.once('listening', r));
  base = `http://127.0.0.1:${servidor.address().port}/api`;
});
after(() => servidor.close());

const llamar = async (metodo, ruta, cuerpo) => {
  const r = await fetch(base + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  return { estado: r.status, datos: await r.json() };
};

test('config pública trae el ID de cliente de Google', async () => {
  const { datos } = await llamar('GET', '/config');
  assert.equal(datos.googleClientId, process.env.GOOGLE_CLIENT_ID);
  assert.equal(datos.correoReal, false);
});

test('Google real: token válido crea la cuenta y luego entra a la misma', async () => {
  const a = await llamar('POST', '/google', { credencial: token() });
  assert.equal(a.estado, 201);
  assert.equal(a.datos.usuario.correo, 'real.persona@gmail.com');
  assert.equal(a.datos.usuario.nombre, 'Real Persona');
  const b = await llamar('POST', '/google', { credencial: token({ email: 'nuevo@gmail.com' }) }); // same sub
  assert.equal(b.estado, 200);
  assert.equal(b.datos.usuario.id, a.datos.usuario.id);
});

test('Google real rechaza tokens de otra app, vencidos o sin correo verificado', async () => {
  for (const malo of [{ aud: 'otra-app' }, { exp: '1000' }, { email_verified: 'false' }, { iss: 'evil.com' }]) {
    const r = await llamar('POST', '/google', { credencial: token({ ...malo, sub: 'x' }) });
    assert.equal(r.estado, 401, JSON.stringify(malo));
  }
  assert.equal((await llamar('POST', '/google/demo', { nombre: 'Ana', correo: 'a@gmail.com' })).estado, 404);
});
