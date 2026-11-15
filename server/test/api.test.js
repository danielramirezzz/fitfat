import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

// In-memory database so the tests never touch the real data.
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

const PERFIL = {
  nombre: 'Persona de Prueba',
  fechaNacimiento: '2002-04-15',
  genero: 'Mujer',
  estatura: 165,
  peso: 60,
  objetivo: 'Ganar músculo',
};

test('registro, perfil, login y logout', async () => {
  const reg = await llamar('POST', '/registro', { usuario: 'prueba_1', contrasena: 'clave-segura-1' });
  assert.equal(reg.estado, 201);
  assert.equal(reg.datos.usuario.puntos, 100);
  assert.equal(reg.datos.usuario.perfilCompleto, false);
  assert.equal(reg.datos.usuario.hash, undefined, 'never expose the hash');

  const perfil = await llamar('PUT', '/perfil', PERFIL, reg.datos.token);
  assert.equal(perfil.estado, 200);
  assert.equal(perfil.datos.usuario.perfilCompleto, true);
  assert.equal(perfil.datos.usuario.nombre, 'Persona de Prueba');

  const login = await llamar('POST', '/login', { usuario: 'PRUEBA_1', contrasena: 'clave-segura-1' });
  assert.equal(login.estado, 200, 'username is case-insensitive');
  assert.notEqual(login.datos.token, reg.datos.token);

  const yo = await llamar('GET', '/yo', null, login.datos.token);
  assert.equal(yo.datos.usuario.usuario, 'prueba_1');

  assert.equal((await llamar('POST', '/logout', null, login.datos.token)).estado, 200);
  assert.equal((await llamar('GET', '/yo', null, login.datos.token)).estado, 401);
});

test('login incorrecto da 401 (con un mensaje distinto según el motivo)', async () => {
  await llamar('POST', '/registro', { usuario: 'prueba_2', contrasena: 'clave-segura-2' });
  const malaClave = await llamar('POST', '/login', { usuario: 'prueba_2', contrasena: 'otra-clave' });
  const noExiste = await llamar('POST', '/login', { usuario: 'nadie', contrasena: 'clave-segura-2' });
  assert.equal(malaClave.estado, 401);
  assert.equal(noExiste.estado, 401);
  assert.notEqual(malaClave.datos.error, noExiste.datos.error);
});

test('validaciones del registro', async () => {
  assert.equal((await llamar('POST', '/registro', { usuario: 'ab', contrasena: '12345678' })).estado, 400);
  assert.equal((await llamar('POST', '/registro', { usuario: 'prueba_3', contrasena: 'corta' })).estado, 400);
  await llamar('POST', '/registro', { usuario: 'prueba_3', contrasena: 'clave-segura-3' });
  assert.equal((await llamar('POST', '/registro', { usuario: 'Prueba_3', contrasena: 'clave-segura-3' })).estado, 409);
});

test('validaciones del perfil y sesión requerida', async () => {
  const { datos } = await llamar('POST', '/registro', { usuario: 'prueba_4', contrasena: 'clave-segura-4' });
  assert.equal((await llamar('PUT', '/perfil', PERFIL)).estado, 401);
  const malo = await llamar('PUT', '/perfil', { ...PERFIL, fechaNacimiento: '2002-02-31', estatura: 300 }, datos.token);
  assert.equal(malo.estado, 400);
  assert.deepEqual(malo.datos.campos, ['fechaNacimiento', 'estatura']);
});

test('login: entra con usuario o correo y explica el motivo cuando falla', async () => {
  await llamar('POST', '/registro', { usuario: 'login_claro', contrasena: 'clave-segura-1', correo: 'Login.Claro@correo.com' });
  assert.equal((await llamar('POST', '/login', { usuario: 'login_claro', contrasena: 'clave-segura-1' })).estado, 200);
  assert.equal((await llamar('POST', '/login', { usuario: 'LOGIN.claro@correo.com', contrasena: 'clave-segura-1' })).estado, 200);

  const noExiste = await llamar('POST', '/login', { usuario: 'nadie_aqui', contrasena: 'x' });
  assert.equal(noExiste.estado, 401);
  assert.equal(noExiste.datos.motivo, 'usuario');

  const mala = await llamar('POST', '/login', { usuario: 'login_claro', contrasena: 'otra-clave' });
  assert.equal(mala.datos.motivo, 'contrasena');
});
