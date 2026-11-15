import { linearTiming, springTiming, TransitionPresentation, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { AbsoluteFill, Audio, interpolate, staticFile } from 'remotion';

import { EscenaVota } from './escenas/Cierre';
import { EscenaAvisos, EscenaComida, EscenaLogros, EscenaRacha, EscenaRutinas } from './escenas/Funciones';
import { EscenaExcusas, EscenaRayo } from './escenas/Intro';

// Scene lengths in frames (30 fps) and the transitions between them.
export const ESCENAS = [
  { id: 'excusas', duracion: 120, Componente: EscenaExcusas },
  { id: 'rayo', duracion: 110, Componente: EscenaRayo },
  { id: 'racha', duracion: 135, Componente: EscenaRacha },
  { id: 'rutinas', duracion: 140, Componente: EscenaRutinas },
  { id: 'comida', duracion: 130, Componente: EscenaComida },
  { id: 'avisos', duracion: 140, Componente: EscenaAvisos },
  { id: 'logros', duracion: 95, Componente: EscenaLogros },
  { id: 'vota', duracion: 170, Componente: EscenaVota },
];

const TRANSICIONES = [
  { presentacion: fade(), tiempo: linearTiming({ durationInFrames: 8 }) },
  { presentacion: slide({ direction: 'from-right' }), tiempo: springTiming({ config: { damping: 200 }, durationInFrames: 16 }) },
  { presentacion: wipe({ direction: 'from-left' }), tiempo: linearTiming({ durationInFrames: 14 }) },
  { presentacion: slide({ direction: 'from-bottom' }), tiempo: springTiming({ config: { damping: 200 }, durationInFrames: 16 }) },
  { presentacion: wipe({ direction: 'from-top-right' }), tiempo: linearTiming({ durationInFrames: 14 }) },
  { presentacion: slide({ direction: 'from-left' }), tiempo: springTiming({ config: { damping: 200 }, durationInFrames: 16 }) },
  { presentacion: fade(), tiempo: linearTiming({ durationInFrames: 12 }) },
];

export const DURACION_TOTAL =
  ESCENAS.reduce((t, e) => t + e.duracion, 0) - TRANSICIONES.reduce((t, x) => t + x.tiempo.getDurationInFrames({ fps: 30 }), 0);

export function FitFatPitch() {
  return (
    <AbsoluteFill style={{ backgroundColor: '#050505' }}>
      {/* "Rising Forest" by Diego Nava (Mixkit free license): fade in, then fade out at the end */}
      <Audio
        src={staticFile('musica-rising-forest.mp3')}
        volume={(f) =>
          interpolate(f, [0, 20, DURACION_TOTAL - 45, DURACION_TOTAL], [0, 0.85, 0.85, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        }
      />
      <TransitionSeries>
        {ESCENAS.map(({ id, duracion, Componente }, i) => [
          <TransitionSeries.Sequence key={id} durationInFrames={duracion}>
            <Componente />
          </TransitionSeries.Sequence>,
          i < TRANSICIONES.length ? (
            <TransitionSeries.Transition key={`t-${id}`} presentation={TRANSICIONES[i].presentacion as TransitionPresentation<Record<string, unknown>>} timing={TRANSICIONES[i].tiempo} />
          ) : null,
        ])}
      </TransitionSeries>
    </AbsoluteFill>
  );
}
