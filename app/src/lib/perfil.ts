import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { Usuario } from '@/lib/api';
import { Nivel, Logro } from '@/lib/progreso';
import { Frecuencia } from '@/lib/alertas';
import { actualizarUsuario, apiConSesion } from '@/lib/sesion';

export type DatosPerfil = {
  usuario: Usuario;
  nivel: Nivel;
  racha: number;
  rutinas: number;
  cambioPesoKg: number | null; // since the first weigh-in
  logros: { total: number; desbloqueados: number; proximo: string | null; lista: Logro[] };
  notificacionesNoLeidas: number;
  recordatorio: { activo: boolean; hora: string; frecuencia: Frecuencia };
};

export async function cargarPerfil(): Promise<DatosPerfil> {
  const d = await apiConSesion<DatosPerfil>('GET', '/perfil/resumen');
  actualizarUsuario(d.usuario);
  return d;
}

export type CambiosPerfil = { nombre: string; correo: string; peso: number; estatura: number; objetivo: string };

export async function editarPerfil(c: CambiosPerfil) {
  const r = await apiConSesion<{ usuario: Usuario }>('PUT', '/perfil/editar', c);
  actualizarUsuario(r.usuario);
  return r.usuario;
}

export const cambiarContrasena = (actual: string, nueva: string) =>
  apiConSesion<{ ok: boolean }>('PUT', '/contrasena', { actual, nueva });

// "1,75" or "1.75" → 1.75 (NaN if it is not a number)
export const numero = (t: string) => Number(t.trim().replace(',', '.'));
export const conComa = (n: number, decimales = 1) => n.toFixed(decimales).replace('.', ',');

// --- Profile photo -------------------------------------------------------------------
// The photo stays on this device (it is not uploaded to the server).

const claveFoto = (usuarioId: number) => `fitfat_foto_${usuarioId}`;
let fotos: Record<number, string | null> = {};
const oyentes = new Set<() => void>();
const cargando = new Set<number>();

function avisarCambio(usuarioId: number, uri: string | null) {
  fotos = { ...fotos, [usuarioId]: uri };
  oyentes.forEach((o) => o());
}

async function leerFoto(usuarioId: number) {
  try {
    const uri =
      Platform.OS === 'web'
        ? (globalThis.localStorage?.getItem(claveFoto(usuarioId)) ?? null)
        : await SecureStore.getItemAsync(claveFoto(usuarioId));
    avisarCambio(usuarioId, uri);
  } catch {
    avisarCambio(usuarioId, null);
  }
}

// Returns the photo URI of this user (or null). Loads it the first time.
export function useFoto(usuarioId: number | undefined) {
  const foto = useSyncExternalStore(
    (o) => {
      oyentes.add(o);
      return () => oyentes.delete(o);
    },
    () => (usuarioId === undefined ? null : fotos[usuarioId]),
  );
  if (usuarioId !== undefined && foto === undefined && !cargando.has(usuarioId)) {
    cargando.add(usuarioId);
    queueMicrotask(() => leerFoto(usuarioId)); // after this render, not during it
  }
  return foto ?? null;
}

// Opens the gallery; returns false if the user cancelled.
export async function elegirFoto(usuarioId: number): Promise<boolean> {
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.3,
    base64: Platform.OS === 'web', // the browser keeps it as text (data URL)
  });
  if (r.canceled || !r.assets[0]) return false;
  const a = r.assets[0];
  const uri = Platform.OS === 'web' && a.base64 ? `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}` : a.uri;
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(claveFoto(usuarioId), uri);
    else await SecureStore.setItemAsync(claveFoto(usuarioId), uri);
  } catch {
    // too big to remember: it is still shown until the app closes
  }
  avisarCambio(usuarioId, uri);
  return true;
}
