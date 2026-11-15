import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

process.env.FITFAT_DB = ':memory:';
const { app } = await import('../src/app.js');
const { db } = await import('../src/db.js');

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

test('los catálogos se cargan en la base de datos', () => {
  const n = (tabla) => db.prepare(`SELECT COUNT(*) AS n FROM ${tabla}`).get().n;
  assert.ok(n('alimentos') >= 49);
  assert.equal(n('grupos_musculares'), 6);
  assert.equal(n('ejercicios'), 24);
  assert.equal(n('logros'), 12);
});

test('un alimento escrito a mano queda guardado solo para esa persona', async () => {
  const ana = (await llamar('POST', '/registro', { usuario: 'ana_cat', contrasena: 'clave-segura-1' })).datos.token;
  const luis = (await llamar('POST', '/registro', { usuario: 'luis_cat', contrasena: 'clave-segura-1' })).datos.token;

  const guardado = await llamar(
    'POST',
    '/comida/registro',
    { comida: 'almuerzo', alimentos: [{ nombre: 'Sancocho de gallina', porcion: '1 plato', categoria: 'otro' }], habitos: {} },
    ana,
  );
  assert.equal(guardado.estado, 200);

  const deAna = await llamar('GET', '/alimentos?q=sancocho', null, ana);
  assert.deepEqual(deAna.datos.resultados, [{ nombre: 'Sancocho de gallina', porcion: '1 plato', categoria: 'otro' }]);
  const deLuis = await llamar('GET', '/alimentos?q=sancocho', null, luis);
  assert.deepEqual(deLuis.datos.resultados, []);

  // A food that already exists in the shared catalog is not duplicated.
  await llamar('POST', '/comida/registro', { comida: 'cena', alimentos: [{ nombre: 'arroz blanco', porcion: '1 taza', categoria: 'cereal' }], habitos: {} }, ana);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM alimentos WHERE busqueda = 'arroz blanco'").get().n, 1);
});

test('las rutinas salen de la tabla de ejercicios', async () => {
  const token = (await llamar('POST', '/registro', { usuario: 'rut_cat', contrasena: 'clave-segura-1' })).datos.token;
  db.prepare("UPDATE ejercicios SET nombre = 'Flexiones de la BD' WHERE grupo = 'pecho' AND orden = 1").run();
  const { datos } = await llamar('GET', '/rutinas/pecho?minutos=15', null, token);
  assert.equal(datos.ejercicios[1].nombre, 'Flexiones de la BD');
});
