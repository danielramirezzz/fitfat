import { apiConSesion } from '@/lib/sesion';

export type Nivel = { nivel: number; puntos: number; siguiente: number };

export type DatosSemana = {
  inicio: string;
  fin: string;
  rango: string;
  actual: boolean;
  dias: { fecha: string; letra: string; minutos: number; hoy: boolean; futuro: boolean }[];
  entrenos: number;
  metaEntrenos: number;
  minutos: number;
  metaMinutos: number;
  cambioPeso: number | null;
  objetivo: string | null;
  nivel: Nivel;
};

export type Periodo = 'semana' | 'mes' | 'ano';

export type Logro = {
  clave: string;
  nombre: string;
  descripcion: string;
  tipo: 'racha' | 'rutina' | 'agua';
  desbloqueado: boolean;
};

export type DatosEstadisticas = {
  periodo: Periodo;
  pesoActual: number | null;
  puntos: { etiqueta: string; kg: number | null }[];
  cambio: number | null;
  textoCambio: string;
  objetivo: string | null;
  logros: { total: number; desbloqueados: number; lista: Logro[] };
  resumen: { rutinas: number; grupo: string | null; diasComida: number; diasPeriodo: number; aguaPromedio: number };
};

export const cargarSemana = (offset = 0) => apiConSesion<DatosSemana>('GET', `/progreso/semana?offset=${offset}`);

export const cargarEstadisticas = (periodo: Periodo) =>
  apiConSesion<DatosEstadisticas>('GET', `/progreso/estadisticas?periodo=${periodo}`);

export const guardarPeso = (kg: number) => apiConSesion<{ ok: boolean; kg: number }>('POST', '/peso', { kg });

// -0.6 → "−0,6 kg" (typographic minus and decimal comma, as in Figma).
export function formatoKg(n: number, conSigno = true) {
  const signo = conSigno ? (n > 0 ? '+' : n < 0 ? '−' : '') : '';
  return `${signo}${Math.abs(n).toFixed(1).replace('.', ',')} kg`;
}

// Is this weight change good for the user's goal? (green if yes)
export function cambioFavorable(cambio: number, objetivo: string | null) {
  if (objetivo === 'Ganar músculo') return cambio > 0;
  if (objetivo === 'Mantenerme') return Math.abs(cambio) <= 0.5;
  return cambio < 0; // lose weight (default)
}

// 1290 → "1.290"
export const miles = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
