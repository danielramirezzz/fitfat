import { ReactNode } from 'react';
import { Img, staticFile } from 'remotion';

import { C } from '../tema';

// A phone floating in 3D with a real FitFat screenshot inside.
// The screen keeps the app's own size (402 x 874 points), scaled to `alto` px,
// so overlays (`children`) use the same coordinates as the app.
type Props = {
  pantalla: string; // file in public/pantallas
  alto?: number; // phone height in px
  x?: number; // center offset from the middle of the frame
  y?: number;
  rotY?: number;
  rotX?: number;
  rotZ?: number;
  escala?: number;
  scroll?: number; // moves the screenshot up (app points)
  opacidad?: number;
  brillo?: string; // glow color
  children?: ReactNode;
};

const ANCHO_APP = 402;
const ALTO_APP = 874;

export function Celular({
  pantalla,
  alto = 820,
  x = 0,
  y = 0,
  rotY = 0,
  rotX = 0,
  rotZ = 0,
  escala = 1,
  scroll = 0,
  opacidad = 1,
  brillo = C.verde,
  children,
}: Props) {
  const borde = 14;
  const k = (alto - borde * 2) / ALTO_APP;
  const ancho = ANCHO_APP * k + borde * 2;
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: ancho,
        height: alto,
        marginLeft: -ancho / 2 + x,
        marginTop: -alto / 2 + y,
        opacity: opacidad,
        transform: `perspective(2200px) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${escala})`,
        transformStyle: 'preserve-3d',
      }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 64,
          background: 'linear-gradient(145deg, #2b2b2b, #0a0a0a 40%, #1a1a1a)',
          boxShadow: `0 50px 120px rgba(0,0,0,0.7), 0 0 90px ${brillo}33, inset 0 0 0 2px #3a3a3a`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: borde,
          top: borde,
          width: ANCHO_APP * k,
          height: ALTO_APP * k,
          borderRadius: 50,
          overflow: 'hidden',
          background: C.fondo,
        }}>
        <div
          style={{
            width: ANCHO_APP,
            height: ALTO_APP,
            transform: `scale(${k})`,
            transformOrigin: 'top left',
            position: 'relative',
          }}>
          <Img
            src={staticFile(`pantallas/${pantalla}`)}
            style={{ position: 'absolute', left: 0, top: -scroll, width: ANCHO_APP }}
          />
          <div style={{ position: 'absolute', left: 0, top: -scroll, width: ANCHO_APP, height: ALTO_APP }}>
            {children}
          </div>
        </div>
        {/* glass reflection */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(115deg, rgba(255,255,255,0.10) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.04) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
      {/* notch */}
      <div
        style={{
          position: 'absolute',
          top: borde + 10,
          left: '50%',
          width: 110,
          height: 30,
          marginLeft: -55,
          borderRadius: 20,
          background: '#000',
        }}
      />
    </div>
  );
}
