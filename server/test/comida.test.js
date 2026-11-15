import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

process.env.FITFAT_DB = ':memory:';
const { app } = await import('../src/app.js');
const { buscarAlimentos, planDelDia } = await import('../src/comida.js');

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

const ALMUERZO = [
  { nombre: 'Arroz blanco', porcion: '1 taza', categoria: 'cereal' },
  { nombre: 'Pechuga de pollo', porcion: '150 g', categoria: 'proteina' },
];

test('buscar alimentos ignora tildes y mayúsculas', () => {
  assert.equal(buscarAlimentos('PLATANO')[0].nombre, 'Plátano maduro');
  assert.deepEqual(buscarAlimentos(''), []);
  assert.ok(buscarAlimentos('a').length <= 6);
});

test('plan del día cambia según el objetivo', () => {
  const perder = planDelDia('2026-11-09', 'Perder peso');
  const ganar = planDelDia('2026-11-09', 'Ganar músculo');
  assert.equal(perder.length, 4);
  assert.equal(perder[0].plato, ganar[0].plato); // breakfast is shared
  assert.notEqual(perder[2].plato, ganar[2].plato); // lunch depends on the goal
});

test('registro de comida: puntos una vez por comida, hábitos y plan', async () => {
  const { datos: cuenta } = await llamar('POST', '/registro', { usuario: 'comelon', contrasena: 'clave-segura-1' });
  const t = cuenta.token;

  const vacio = await llamar('POST', '/comida/registro', { comida: 'almuerzo', alimentos: [] }, t);
  assert.equal(vacio.estado, 400);

  const r1 = await llamar(
    'POST',
    '/comida/registro',
    { comida: 'almuerzo', alimentos: ALMUERZO, habitos: { agua: 6, sueno: 7, ejercicio: true } },
    t,
  );
  assert.equal(r1.estado, 200);
  assert.equal(r1.datos.puntosGanados, 20);
  assert.deepEqual(r1.datos.racha, { antes: 0, ahora: 1 });
  assert.equal(r1.datos.usuario.puntos, 120);

  // Editing the same meal again: replaces foods, no extra points.
  const r2 = await llamar('POST', '/comida/registro', { comida: 'almuerzo', alimentos: ALMUERZO.slice(0, 1), habitos: { agua: 7 } }, t);
  assert.equal(r2.datos.puntosGanados, 0);

  const hoy = await llamar('GET', '/comida/hoy', null, t);
  assert.equal(hoy.datos.comidas.almuerzo.length, 1);
  assert.equal(hoy.datos.habitos.agua, 7);

  const inicio = await llamar('GET', '/inicio', null, t);
  assert.deepEqual(inicio.datos.comidas, { hoy: 1, meta: 4 });

  const plan = await llamar('GET', '/comida/plan', null, t);
  assert.equal(plan.datos.semana.length, 7);
  assert.equal(plan.datos.semana[0].dia, 'LUN');
  assert.equal(plan.datos.comidas.find((c) => c.clave === 'almuerzo').hecho, true);
  assert.equal(plan.datos.hechas, 1);

  const busca = await llamar('GET', '/alimentos?q=pollo', null, t);
  assert.equal(busca.datos.resultados[0].nombre, 'Pechuga de pollo');
});
