import * as SecureStore from 'expo-secure-store';
import * as Speech from 'expo-speech';
import { useSyncExternalStore } from 'react';
import { Platform, Vibration } from 'react-native';

// Accessibility preferences, chosen with the floating button.
// They live on the device (not on the server), like the session token.
export type Accesibilidad = {
  escala: 1 | 1.15 | 1.3; // text size
  contraste: boolean; // brighter gray texts
  voz: boolean; // spoken guidance during routines
  sonidos: boolean; // vibrate when a set or a rest ends (Ajustes → Sonidos y vibración)
};

const CLAVE = 'fitfat_accesibilidad';
let actual: Accesibilidad = { escala: 1, contraste: false, voz: false, sonidos: false };
const oyentes = new Set<() => void>();

async function leer(): Promise<string | null> {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(CLAVE) ?? null;
  return SecureStore.getItemAsync(CLAVE);
}

// Called once in the root layout, before the first screen is shown.
export async function cargarAccesibilidad() {
  try {
    const guardado = await leer();
    if (guardado) actual = { ...actual, ...JSON.parse(guardado) };
  } catch {
    // keep the defaults
  }
}

export function cambiarAccesibilidad(cambios: Partial<Accesibilidad>) {
  actual = { ...actual, ...cambios };
  oyentes.forEach((o) => o());
  const texto = JSON.stringify(actual);
  if (Platform.OS === 'web') globalThis.localStorage?.setItem(CLAVE, texto);
  else SecureStore.setItemAsync(CLAVE, texto).catch(() => {});
}

export function obtenerAccesibilidad() {
  return actual;
}

export function useAccesibilidad() {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o);
      return () => oyentes.delete(o);
    },
    () => actual,
  );
}

// Reads a sentence out loud, only if "Guía por voz" is on.
export function hablar(texto: string) {
  if (!actual.voz) return;
  Speech.stop();
  Speech.speak(texto, { language: 'es-ES', rate: 1 });
}

// Short vibration (if "Sonidos y vibración" is on). Does nothing in the browser.
export function vibrar() {
  if (actual.sonidos && Platform.OS !== 'web') Vibration.vibrate(400);
}

export function callar() {
  Speech.stop();
}
