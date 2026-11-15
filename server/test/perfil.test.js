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

async function nuevaCuenta(usuario) {
  const { datos } = await llamar('POST', '/registro', { usuario, contrasena: 'clave-segura-1' });
  await llamar(
    'PUT',
    '/perfil',
    { nombre: 'Ana Prueba', fechaNacimiento: '2001-01-01', genero: 'Mujer', estatura: 165, peso: 62, objetivo: 'Perder peso' },
    datos.token,
  );
  return datos.token;
}

test('resumen del perfil', async () => {
  const token = await nuevaCuenta('perfil_1');
  const { estado, datos } = await llamar('GET', '/perfil/resumen', null, token);
  assert.equal(estado, 200);
  assert.equal(datos.usuario.nombre, 'Ana Prueba');
  assert.equal(datos.nivel.nivel, 1);
  assert.equal(datos.rutinas, 0);
  assert.equal(datos.cambioPesoKg, null, 'a single weigh-in has no change');
  assert.equal(datos.logros.total, 12);
  assert.equal(datos.logros.desbloqueados, 1); // "Primer paso"
  assert.equal(datos.logros.proximo, 'Racha 3 días');
  assert.equal(datos.recordatorio.hora, '07:00');
});

test('editar perfil valida y guarda (con decimales en el peso)', async () => {
  const token = await nuevaCuenta('perfil_2');
  const malo = await llamar('PUT', '/perfil/editar', { nombre: 'A', correo: 'no-es-correo', peso: 10, estatura: 50, objetivo: 'x' }, token);
  assert.equal(malo.estado, 400);
  assert.deepEqual(malo.datos.campos.sort(), ['correo', 'estatura', 'nombre', 'objetivo', 'peso']);

  const ok = await llamar(
    'PUT',
    '/perfil/editar',
    { nombre: 'Ana María', correo: 'Ana@Correo.com', peso: 61.4, estatura: 166, objetivo: 'Mantenerme' },
    token,
  );
  assert.equal(ok.estado, 200);
  assert.equal(ok.datos.usuario.correo, 'ana@correo.com');
  assert.equal(ok.datos.usuario.peso, 61.4);
  assert.equal(ok.datos.usuario.objetivo, 'Mantenerme');
});

test('cambiar contraseña', async () => {
  const token = await nuevaCuenta('perfil_3');
  const otro = (await llamar('POST', '/login', { usuario: 'perfil_3', contrasena: 'clave-segura-1' })).datos.token;

  const mala = await llamar('PUT', '/contrasena', { actual: 'equivocada', nueva: 'otra-clave-2' }, token);
  assert.equal(mala.estado, 401);
  const corta = await llamar('PUT', '/contrasena', { actual: 'clave-segura-1', nueva: 'corta' }, token);
  assert.equal(corta.estado, 400);

  const ok = await llamar('PUT', '/contrasena', { actual: 'clave-segura-1', nueva: 'otra-clave-2' }, token);
  assert.equal(ok.estado, 200);
  assert.equal((await llamar('GET', '/yo', null, token)).estado, 200, 'this device stays signed in');
  assert.equal((await llamar('GET', '/yo', null, otro)).estado, 401, 'other devices are signed out');
  assert.equal((await llamar('POST', '/login', { usuario: 'perfil_3', contrasena: 'otra-clave-2' })).estado, 200);
});
