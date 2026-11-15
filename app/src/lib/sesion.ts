import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { api, ErrorApi, Usuario } from '@/lib/api';

// Session of the signed-in user: token + data. The token is saved on the
// device (SecureStore on the phone, localStorage in the browser) so the user
// stays signed in after closing the app.

const CLAVE = 'fitfat.token';

type Estado = { token: string | null; usuario: Usuario | null };
let estado: Estado = { token: null, usuario: null };
const oyentes = new Set<() => void>();

function cambiar(nuevo: Estado) {
  estado = nuevo;
  oyentes.forEach((o) => o());
}

const almacen = {
  async leer() {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(CLAVE) ?? null;
    return SecureStore.getItemAsync(CLAVE);
  },
  async guardar(token: string) {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(CLAVE, token);
    else await SecureStore.setItemAsync(CLAVE, token);
  },
  async borrar() {
    if (Platform.OS === 'web') globalThis.localStorage?.removeItem(CLAVE);
    else await SecureStore.deleteItemAsync(CLAVE);
  },
};

type RespuestaSesion = { token: string; usuario: Usuario };

export async function iniciarSesion(usuario: string, contrasena: string) {
  const r = await api<RespuestaSesion>('POST', '/login', { usuario, contrasena });
  await almacen.guardar(r.token);
  cambiar(r);
  return r.usuario;
}

export async function registrarse(usuario: string, contrasena: string, correo = '') {
  const r = await api<RespuestaSesion>('POST', '/registro', { usuario, contrasena, correo });
  await almacen.guardar(r.token);
  cambiar(r);
  return r.usuario;
}

// "Continuar con Google" (real): the ID token from Google's official button.
export async function entrarConGoogle(credencial: string) {
  const r = await api<RespuestaSesion & { nueva: boolean }>('POST', '/google', { credencial });
  await almacen.guardar(r.token);
  cambiar({ token: r.token, usuario: r.usuario });
  return r;
}

// "Continuar con Google" in demo mode (see server/src/cuentas.js).
export async function entrarConGoogleDemo(nombre: string, correo: string) {
  const r = await api<RespuestaSesion & { nueva: boolean }>('POST', '/google/demo', { nombre, correo });
  await almacen.guardar(r.token);
  cambiar({ token: r.token, usuario: r.usuario });
  return r;
}

export type DatosPerfil = {
  nombre: string;
  fechaNacimiento: string; // YYYY-MM-DD
  genero: string;
  estatura: number;
  peso: number;
  objetivo: string;
};

export async function guardarPerfil(datos: DatosPerfil) {
  const r = await api<{ usuario: Usuario }>('PUT', '/perfil', datos, estado.token);
  cambiar({ ...estado, usuario: r.usuario });
  return r.usuario;
}

// Called once when the app starts (root layout), before any screen renders:
// loads the saved token so every screen — even one opened directly — can use it.
export async function prepararSesion() {
  const token = await almacen.leer().catch(() => null);
  if (token) cambiar({ ...estado, token });
}

// Called by the entry screen: checks the saved session is still valid.
export async function restaurarSesion(): Promise<Usuario | null> {
  const token = estado.token ?? (await almacen.leer());
  if (!token) return null;
  try {
    const r = await api<{ usuario: Usuario }>('GET', '/yo', undefined, token);
    cambiar({ token, usuario: r.usuario });
    return r.usuario;
  } catch (e) {
    // Only forget the token if the server rejected it (not if it is offline).
    if (e instanceof ErrorApi && e.estado === 401) await almacen.borrar();
    throw e;
  }
}

export async function cerrarSesion() {
  const token = estado.token;
  cambiar({ token: null, usuario: null });
  await almacen.borrar();
  if (token) await api('POST', '/logout', undefined, token).catch(() => {});
}

// Authenticated request with the current token. If the server says the session
// is no longer valid (401), we forget it so the app goes back to Login.
export async function apiConSesion<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  const token = estado.token;
  try {
    return await api<T>(metodo, ruta, cuerpo, token);
  } catch (e) {
    // Only forget the session if the server rejected the token we actually sent.
    if (token && token === estado.token && e instanceof ErrorApi && e.estado === 401) {
      cambiar({ token: null, usuario: null });
      await almacen.borrar();
    }
    throw e;
  }
}

// Updates the cached user (e.g. after loading fresh points from the server).
export function actualizarUsuario(usuario: Usuario) {
  cambiar({ ...estado, usuario });
}

// React hook: re-renders the component when the session changes.
export function useSesion() {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o);
      return () => oyentes.delete(o);
    },
    () => estado,
    () => estado,
  );
}
