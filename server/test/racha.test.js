import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.FITFAT_DB = ':memory:';
const { db } = await import('../src/db.js');
const { calcularRacha, registrarActividad } = await import('../src/racha.js');

function nuevoUsuario(nombre) {
  return db.prepare("INSERT INTO usuarios (usuario, hash, sal) VALUES (?, 'x', 'x')").run(nombre).lastInsertRowid;
}

// Wednesday 2026-11-11 is "today" in these tests.
const HOY = '2026-11-11';

test('sin actividad: racha 0 y semana apagada', () => {
  const r = calcularRacha(nuevoUsuario('r0'), HOY);
  assert.equal(r.dias, 0);
  assert.equal(r.hoyActivo, false);
  assert.deepEqual(
    r.semana.map((d) => d.letra),
    ['J', 'V', 'S', 'D', 'L', 'M', 'HOY'],
  );
  assert.ok(r.semana.every((d) => !d.activo));
});

test('días seguidos hasta ayer cuentan aunque hoy no haya actividad', () => {
  const id = nuevoUsuario('r1');
  for (const f of ['2026-11-08', '2026-11-09', '2026-11-10']) registrarActividad(id, 'rutina', 50, f);
  const r = calcularRacha(id, HOY);
  assert.equal(r.dias, 3);
  assert.equal(r.hoyActivo, false);
});

test('actividad hoy suma al día y da puntos', () => {
  const id = nuevoUsuario('r2');
  registrarActividad(id, 'rutina', 50, '2026-11-10');
  registrarActividad(id, 'rutina', 50, HOY);
  registrarActividad(id, 'comida', 10, HOY); // same day only counts once
  const r = calcularRacha(id, HOY);
  assert.equal(r.dias, 2);
  assert.equal(r.hoyActivo, true);
  assert.equal(db.prepare('SELECT puntos FROM usuarios WHERE id = ?').get(id).puntos, 110);
});

test('un día sin actividad apaga la racha', () => {
  const id = nuevoUsuario('r3');
  registrarActividad(id, 'rutina', 0, '2026-11-08'); // gap on 11-09 and 11-10
  assert.equal(calcularRacha(id, HOY).dias, 0);
});
