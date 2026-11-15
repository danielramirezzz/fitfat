import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

process.env.FITFAT_DB = ':memory:';
const { app } = await import('../src/app.js');
const { mejorRacha, registrarActividad } = await import('../src/racha.js');
const { armarRutina, nivelDe } = await import('../src/rutinas.js');

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
  const r = await llamar('POST', '/registro', { usuario, contrasena: 'clave-segura-1' });
  return r.datos;
}

test('armarRutina: calentamiento + 4 ejercicios y series según el tiempo', () => {
  const r15 = armarRutina('piernas', 15);
  const r45 = armarRutina('piernas', 45);
  assert.equal(r15.ejercicios.length, 5);
  assert.equal(r15.ejercicios[0].nombre, 'Calentamiento');
  assert.equal(r15.ejercicios[1].series, 2);
  assert.equal(r45.ejercicios[1].series, 4);
  assert.equal(armarRutina('cuello', 30), null);
  assert.equal(armarRutina('piernas', 20), null);
});

test('niveles cada 500 puntos', () => {
  assert.deepEqual(nivelDe(1290), { nivel: 3, puntos: 1290, siguiente: 1500 });
  assert.equal(nivelDe(100).nivel, 1);
});

test('GET rutina y completar suma puntos, racha y grupo más entrenado', async () => {
  const { token } = await nuevaCuenta('atleta_1');

  const rutina = await llamar('GET', '/rutinas/brazos?minutos=30', null, token);
  assert.equal(rutina.estado, 200);
  assert.equal(rutina.datos.titulo, 'Rutina de brazos');
  assert.equal((await llamar('GET', '/rutinas/cuello', null, token)).estado, 404);

  const hecho = await llamar('POST', '/rutinas/completar', { grupo: 'brazos', minutos: 30 }, token);
  assert.equal(hecho.estado, 200);
  assert.equal(hecho.datos.puntosGanados, 50);
  assert.equal(hecho.datos.usuario.puntos, 150); // 100 welcome + 50
  assert.equal(hecho.datos.racha.dias, 1);
  assert.equal(hecho.datos.nivel.nivel, 1);

  const resumen = await llamar('GET', '/rutinas/resumen', null, token);
  assert.equal(resumen.datos.masEntrenadoHoy, 'Brazos');

  const inicio = await llamar('GET', '/inicio', null, token);
  assert.equal(inicio.datos.racha.hoyActivo, true);
});

test('mejorRacha cuenta la racha más larga antes de una fecha', async () => {
  const { usuario } = await nuevaCuenta('atleta_2');
  for (const f of ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-10', '2026-10-11']) {
    registrarActividad(usuario.id, 'rutina', 0, f);
  }
  assert.equal(mejorRacha(usuario.id, '2026-11-01'), 3);
  assert.equal(mejorRacha(usuario.id, '2026-10-03'), 2);
});
