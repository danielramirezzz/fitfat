import { Usuario } from '@/lib/api';
import { actualizarUsuario, apiConSesion } from '@/lib/sesion';

export type Ejercicio = {
  nombre: string;
  series: number;
  reps?: number;
  segundos?: number;
  detalle: string;
  duracionSerie: number; // seconds per set
  descanso: number; // seconds of rest between sets
  video: string; // key of the video in app/assets/videos (see components/video-ejercicio.tsx)
};

export type Rutina = {
  grupo: string;
  nombreGrupo: string;
  titulo: string;
  minutos: number;
  nivel: string;
  puntos: number;
  calorias: number;
  ejercicios: Ejercicio[];
};

export type ResultadoRutina = {
  puntosGanados: number;
  minutos: number;
  ejercicios: number;
  calorias: number;
  racha: { dias: number; record: boolean; recordAnterior: number };
  nivel: { nivel: number; puntos: number; siguiente: number };
  usuario: Usuario;
};

// Muscle groups shown on "Grupo muscular", with their Figma graphics.
export const GRUPOS = [
  {
    clave: 'pecho',
    nombre: 'Pecho',
    sub: 'Empuje',
    cuadro: require('@/assets/figma/rutinas/cuadro-pecho.svg'),
    icono: require('@/assets/figma/rutinas/icono-pecho.svg'),
    ancho: 26,
    alto: 23.25,
  },
  {
    clave: 'espalda',
    nombre: 'Espalda',
    sub: 'Postura',
    cuadro: require('@/assets/figma/rutinas/cuadro-espalda.svg'),
    icono: require('@/assets/figma/rutinas/icono-espalda.svg'),
    ancho: 19,
    alto: 33,
  },
  {
    clave: 'piernas',
    nombre: 'Piernas',
    sub: 'Glúteos',
    cuadro: require('@/assets/figma/rutinas/cuadro-piernas.svg'),
    icono: require('@/assets/figma/rutinas/icono-piernas.svg'),
    ancho: 13,
    alto: 30,
  },
  {
    clave: 'brazos',
    nombre: 'Brazos',
    sub: 'Bíceps y tríceps',
    cuadro: require('@/assets/figma/rutinas/cuadro-brazos.svg'),
    icono: require('@/assets/figma/rutinas/icono-brazos.svg'),
    ancho: 22,
    alto: 22.35,
  },
  {
    clave: 'hombros',
    nombre: 'Hombros',
    sub: 'Deltoides',
    cuadro: require('@/assets/figma/rutinas/cuadro-hombros.svg'),
    icono: null, // drawn from two pieces (head + shoulders), see TarjetaGrupo
    ancho: 28,
    alto: 29,
  },
  {
    clave: 'abdomen',
    nombre: 'Abdomen',
    sub: 'Core',
    cuadro: require('@/assets/figma/rutinas/cuadro-abdomen.svg'),
    icono: require('@/assets/figma/rutinas/icono-abdomen.svg'),
    ancho: 20,
    alto: 28,
  },
] as const;

export const TIEMPOS = [15, 30, 45] as const;

// The routine being trained, shared between Plan → En curso → Completada.
let rutinaActual: Rutina | null = null;
let resultadoActual: ResultadoRutina | null = null;
export const guardarRutinaActual = (r: Rutina) => (rutinaActual = r);
export const obtenerRutinaActual = () => rutinaActual;
export const obtenerResultado = () => resultadoActual;

export function cargarResumen() {
  return apiConSesion<{ masEntrenadoHoy: string | null }>('GET', '/rutinas/resumen');
}

export function cargarRutina(grupo: string, minutos: number) {
  return apiConSesion<Rutina>('GET', `/rutinas/${grupo}?minutos=${minutos}`);
}

export async function completarRutina(r: Rutina) {
  const resultado = await apiConSesion<ResultadoRutina>('POST', '/rutinas/completar', {
    grupo: r.grupo,
    minutos: r.minutos,
  });
  actualizarUsuario(resultado.usuario);
  resultadoActual = resultado;
  return resultado;
}

// "4 × 12" for reps, "3 × 30 s" for timed exercises, "3 min" for the warm-up.
export function cantidad(e: Ejercicio) {
  if (e.series === 1 && e.segundos) return `${e.segundos / 60} min`;
  return e.reps ? `${e.series} × ${e.reps}` : `${e.series} × ${e.segundos} s`;
}

// 75 → "01:15"
export function reloj(segundos: number) {
  const s = Math.max(0, Math.ceil(segundos));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
