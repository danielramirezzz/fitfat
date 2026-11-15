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

test('recuperar contraseña: código, verificación y nueva contraseña', async () => {
  const { datos } = await llamar('POST', '/registro', { usuario: 'olvido_1', contrasena: 'clave-vieja-1' });
  await llamar(
    'PUT',
    '/perfil/editar',
    { nombre: 'Olvido Uno', correo: 'olvido@correo.com', peso: 70, estatura: 170, objetivo: 'Mantenerme' },
    datos.token,
  );

  assert.equal((await llamar('POST', '/recuperar', { correo: 'nadie@correo.com' })).estado, 404);

  const paso1 = await llamar('POST', '/recuperar', { correo: 'Olvido@Correo.com' });
  assert.equal(paso1.estado, 200);
  assert.equal(paso1.datos.destino, 'o•••••@correo.com');
  assert.match(paso1.datos.codigoDemo, /^\d{4}$/);

  const malo = String((Number(paso1.datos.codigoDemo) + 1) % 10000).padStart(4, '0');
  const errado = await llamar('POST', '/recuperar/verificar', { correo: 'olvido@correo.com', codigo: malo });
  assert.equal(errado.estado, 400);
  assert.match(errado.datos.error, /quedan 4/);

  const paso2 = await llamar('POST', '/recuperar/verificar', { correo: 'olvido@correo.com', codigo: paso1.datos.codigoDemo });
  assert.equal(paso2.estado, 200);

  const sinNumero = await llamar('POST', '/recuperar/nueva', { token: paso2.datos.token, contrasena: 'sinnumeros' });
  assert.equal(sinNumero.estado, 400);
  const paso3 = await llamar('POST', '/recuperar/nueva', { token: paso2.datos.token, contrasena: 'clave-nueva-2' });
  assert.equal(paso3.estado, 200);

  assert.equal((await llamar('GET', '/yo', null, datos.token)).estado, 401, 'old sessions are closed');
  assert.equal((await llamar('POST', '/login', { usuario: 'olvido_1', contrasena: 'clave-vieja-1' })).estado, 401);
  assert.equal((await llamar('POST', '/login', { usuario: 'olvido_1', contrasena: 'clave-nueva-2' })).estado, 200);
  const reuso = await llamar('POST', '/recuperar/nueva', { token: paso2.datos.token, contrasena: 'otra-clave-3' });
  assert.equal(reuso.estado, 410, 'the token works only once');
});

test('el código se bloquea tras 5 intentos fallidos', async () => {
  await llamar('POST', '/registro', { usuario: 'olvido_2', contrasena: 'clave-vieja-1' });
  const { datos } = await llamar('POST', '/recuperar', { correo: 'olvido_2' }); // username also works
  assert.equal(datos.destino, '@olvido_2');
  const malo = String((Number(datos.codigoDemo) + 1) % 10000).padStart(4, '0');
  for (let i = 0; i < 5; i++) await llamar('POST', '/recuperar/verificar', { correo: 'olvido_2', codigo: malo });
  const bueno = await llamar('POST', '/recuperar/verificar', { correo: 'olvido_2', codigo: datos.codigoDemo });
  assert.equal(bueno.estado, 429);
});

test('Google (demo): crea la cuenta una vez y luego la reutiliza', async () => {
  const primera = await llamar('POST', '/google/demo', { nombre: 'María Gómez', correo: 'Maria.Gomez@gmail.com' });
  assert.equal(primera.estado, 201);
  assert.equal(primera.datos.nueva, true);
  assert.equal(primera.datos.usuario.usuario, 'maria.gomez');
  assert.equal(primera.datos.usuario.puntos, 100);
  assert.equal(primera.datos.usuario.perfilCompleto, false);

  const segunda = await llamar('POST', '/google/demo', { nombre: 'María Gómez', correo: 'maria.gomez@gmail.com' });
  assert.equal(segunda.estado, 200);
  assert.equal(segunda.datos.nueva, false);
  assert.equal(segunda.datos.usuario.id, primera.datos.usuario.id);

  assert.equal((await llamar('POST', '/google/demo', { nombre: 'X', correo: 'no' })).estado, 400);
});
