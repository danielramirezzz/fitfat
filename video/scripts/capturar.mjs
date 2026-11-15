// Captures the real FitFat screens in high resolution for the video.
// Uses headless Chrome through the DevTools protocol (no extra libraries).
// Requires the app running locally (Expo on :8081 + server on :3000).
//   node scripts/capturar.mjs
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:8081';
const SALIDA = new URL('../public/pantallas/', import.meta.url);
const ESCALA = 2.5;

const PANTALLAS = [
  ['inicio', '/inicio'],
  ['rutinas', '/rutinas'],
  ['plan', '/rutinas/plan?grupo=piernas&minutos=30'],
  ['comida', '/comida'],
  ['plan-comida', '/comida/plan'],
  ['progreso', '/progreso'],
  ['estadisticas', '/progreso/estadisticas'],
  ['alertas', '/alertas'],
  ['notificaciones', '/notificaciones'],
  ['premium', '/premium'],
  ['perfil', '/perfil'],
  ['logros', '/perfil/logros'],
  ['login', '/login'],
];

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(SALIDA, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new',
  '--remote-debugging-port=9333',
  `--user-data-dir=${join(tmpdir(), 'fitfat-captura')}`,
  '--hide-scrollbars',
  '--mute-audio',
  'about:blank',
]);

let ws;
for (let i = 0; i < 40 && !ws; i++) {
  await esperar(500);
  try {
    const lista = await (await fetch('http://127.0.0.1:9333/json')).json();
    const pagina = lista.find((p) => p.type === 'page');
    if (pagina) ws = new WebSocket(pagina.webSocketDebuggerUrl);
  } catch {
    // Chrome still starting
  }
}
await new Promise((r) => ws.addEventListener('open', r));

let id = 0;
const pendientes = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pendientes.has(m.id)) {
    pendientes.get(m.id)(m);
    pendientes.delete(m.id);
  }
});
const cdp = (method, params = {}) =>
  new Promise((r) => {
    const n = ++id;
    pendientes.set(n, r);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
const evaluar = async (expression) =>
  (await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

await cdp('Page.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: 402, height: 874, deviceScaleFactor: ESCALA, mobile: true });
await cdp('Page.navigate', { url: `${BASE}/login` });
await esperar(9000);

// Sign in with the local test account and skip the reminder banners.
const estado = await evaluar(`(async () => {
  const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'prueba_web', contrasena: 'Prueba#2026' }) });
  const j = await r.json();
  localStorage.setItem('fitfat.token', j.token);
  const hoy = new Date(); const f = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
  localStorage.setItem('fitfat_avisos_' + f, JSON.stringify(Array.from({ length: 300 }, (_, i) => 'x' + i)));
  return r.status;
})()`);
console.log('login', estado);

const OCULTAR = `(() => { const s = document.createElement('style');
  s.textContent = '[aria-label="Opciones de accesibilidad"]{display:none!important}'; document.head.appendChild(s); })()`;

for (const [nombre, ruta] of PANTALLAS) {
  if (nombre === 'login') await evaluar("localStorage.removeItem('fitfat.token')");
  await cdp('Page.navigate', { url: BASE + ruta });
  await esperar(nombre === 'inicio' ? 9000 : 6000);
  await evaluar(OCULTAR);
  await esperar(1500);
  const { result } = await cdp('Page.captureScreenshot', { format: 'png' });
  writeFileSync(new URL(`${nombre}.png`, SALIDA), Buffer.from(result.data, 'base64'));
  console.log('ok', nombre);
}

ws.close();
chrome.kill();
