import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { cargarConfig, ConfigAlertas, TipoAlerta } from '@/lib/alertas';
import { cargarPremium, Premium } from '@/lib/premium';
import { apiConSesion } from '@/lib/sesion';

// "Alarm clock" for reminders while FitFat is open (web/browser version, the one used
// on the phone through Safari/Chrome). Every few seconds it checks the time; when a
// reminder is due it shows the in-app banner (with a sound), a browser notification
// (if allowed) and saves it in Notificaciones. On Expo Go the phone's own scheduled
// notifications do this job (lib/alertas.ts → programarRecordatorios).

type TipoAviso = TipoAlerta | 'premium';
type Programado = { id: string; tipo: TipoAviso; minuto: number; dias: number[] | null }; // dias: 0 = Sunday
export type Aviso = { id: number; titulo: string; cuerpo: string; premium: boolean };

const VENTANA = 60; // if FitFat opens up to 60 min late, the reminder still shows
const DIAS = { diaria: null, semana: [1, 2, 3, 4, 5], fines: [0, 6] } as const;

let programados: Programado[] = [];
let cola: Aviso[] = [];
let contador = 0;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((o) => o());

// --- What to show ----------------------------------------------------------------------------

export function useAvisoActual() {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o);
      return () => oyentes.delete(o);
    },
    () => cola[0] ?? null,
  );
}

export function cerrarAviso() {
  cola = cola.slice(1);
  avisar();
}

function sonar() {
  if (Platform.OS !== 'web') return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    // Two short notes ("ding-dong").
    [880, 1318].forEach((frecuencia, i) => {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.frequency.value = frecuencia;
      vol.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      vol.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.18 + 0.02);
      vol.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.35);
      osc.connect(vol).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.4);
    });
  } catch {
    // no audio available: the banner is enough
  }
}

function mostrar(titulo: string, cuerpo: string, premium: boolean) {
  cola = [...cola, { id: ++contador, titulo, cuerpo, premium }];
  avisar();
  sonar();
  if (Platform.OS === 'web') {
    navigator.vibrate?.([200, 100, 200]);
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(titulo, { body: cuerpo, icon: '/favicon.ico', tag: `fitfat-${contador}` });
      } catch {
        // some phones only allow notifications from installed apps
      }
    }
  }
}

// Asks the server for the personalized text (it also saves it in Notificaciones).
export async function dispararAviso(tipo: TipoAviso, hora = 'ahora', prueba = false) {
  try {
    const r = await apiConSesion<{ titulo: string; cuerpo: string }>('POST', '/avisos/disparar', { tipo, hora, prueba });
    mostrar(r.titulo, r.cuerpo, tipo === 'premium');
  } catch {
    mostrar('Recordatorio de FitFat 🔥', 'Tu fueguito te está esperando.', tipo === 'premium');
  }
}

// Browser permission for notifications outside the page (asked after a tap).
export async function pedirPermisoNavegador() {
  if (Platform.OS !== 'web' || !('Notification' in window)) return 'no-disponible';
  if (Notification.permission === 'default') return Notification.requestPermission();
  return Notification.permission;
}

// --- Schedule ----------------------------------------------------------------------------------

const aMinutos = (hora: string) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

export function programar(config: ConfigAlertas | null, premium: Premium | null) {
  const nuevos: Programado[] = [];
  if (config?.push) {
    config.tipos.forEach((tipo, i) => {
      // Same timing as on the phone: one per type, 2 minutes apart; weigh-in only on Mondays.
      const dias = tipo === 'pesaje' ? [1] : DIAS[config.frecuencia];
      nuevos.push({ id: `${tipo}-${config.hora}`, tipo, minuto: aMinutos(config.hora) + i * 2, dias: dias ? [...dias] : null });
    });
  }
  if (premium?.activo) {
    for (const hora of premium.horas) nuevos.push({ id: `premium-${hora}`, tipo: 'premium', minuto: aMinutos(hora), dias: null });
  }
  programados = nuevos;
  revisar();
}

// Reloads alerts + Premium from the server (on start and after saving them).
export async function recargarAvisos() {
  const [config, premium] = await Promise.all([cargarConfig().catch(() => null), cargarPremium().catch(() => null)]);
  programar(config, premium);
}

const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function yaMostrados(): string[] {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(`fitfat_avisos_${hoy()}`) ?? '[]');
  } catch {
    return [];
  }
}

function marcar(id: string) {
  try {
    globalThis.localStorage?.setItem(`fitfat_avisos_${hoy()}`, JSON.stringify([...yaMostrados(), id]));
  } catch {
    // private mode: it may repeat, no big deal
  }
}

function revisar() {
  const ahora = new Date();
  const minuto = ahora.getHours() * 60 + ahora.getMinutes();
  const hechos = yaMostrados();
  for (const p of programados) {
    if (p.dias && !p.dias.includes(ahora.getDay())) continue;
    const tarde = minuto - (p.minuto % (24 * 60));
    if (tarde < 0 || tarde > VENTANA || hechos.includes(p.id)) continue;
    marcar(p.id);
    const hora = `${String(Math.floor(p.minuto / 60) % 24).padStart(2, '0')}:${String(p.minuto % 60).padStart(2, '0')}`;
    dispararAviso(p.tipo, hora);
  }
}

let reloj: ReturnType<typeof setInterval> | undefined;

// Started by <VigiaAvisos /> once there is a session. Web only (see the comment above).
export function iniciarVigia() {
  if (Platform.OS !== 'web' || reloj) return;
  reloj = setInterval(revisar, 10_000);
  document.addEventListener('visibilitychange', revisar); // coming back to the tab
  recargarAvisos();
}

export function detenerVigia() {
  clearInterval(reloj);
  reloj = undefined;
  programados = [];
  if (Platform.OS === 'web') document.removeEventListener('visibilitychange', revisar);
}
