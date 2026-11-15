import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import nodemailer from 'nodemailer';

process.env.FITFAT_DB = ':memory:';
process.env.SMTP_USER = 'fitfat.pruebas@gmail.com';
process.env.SMTP_PASS = 'clave-falsa';
const { app } = await import('../src/app.js');
const { usarTransporte } = await import('../src/correo.js');

// Fake mailbox: nodemailer's JSON transport builds the e-mail without sending it.
const enviados = [];
const falso = nodemailer.createTransport({ jsonTransport: true });
usarTransporte({ sendMail: async (m) => enviados.push(JSON.parse((await falso.sendMail(m)).message)) });

let base;
let servidor;
before(async () => {
  servidor = app.listen(0);
  await new Promise((r) => servidor.once('listening', r));
  base = `http://127.0.0.1:${servidor.address().port}/api`;
});
after(() => servidor.close());

const llamar = async (ruta, cuerpo) => {
  const r = await fetch(base + ruta, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
  return { estado: r.status, datos: await r.json() };
};

test('con SMTP el código llega por correo y NO viaja a la app', async () => {
  await llamar('/registro', { usuario: 'con_correo', contrasena: 'clave-segura-1', correo: 'Persona@Correo.com' });
  const r = await llamar('/recuperar', { correo: 'con_correo' });
  assert.equal(r.estado, 200);
  assert.equal(r.datos.codigoDemo, undefined);
  assert.equal(r.datos.destino, 'p•••••@correo.com');
  assert.equal(enviados.length, 1);
  assert.equal(enviados[0].to[0].address, 'persona@correo.com');
  const codigo = enviados[0].subject.slice(0, 4);
  assert.match(codigo, /^\d{4}$/);
  assert.equal((await llamar('/recuperar/verificar', { correo: 'con_correo', codigo })).estado, 200);
});

test('con SMTP, una cuenta sin correo no puede recibir el código', async () => {
  await llamar('/registro', { usuario: 'sin_correo', contrasena: 'clave-segura-1' });
  const r = await llamar('/recuperar', { correo: 'sin_correo' });
  assert.equal(r.estado, 400);
  assert.equal(enviados.length, 1);
});
