import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { Text } from '@/components/texto';
import { Colores, Fuentes } from '@/constants/theme';

type Punto = { etiqueta: string; kg: number | null };

const ALTO = 80; // plot height: 3 grid lines at 0, 40 and 80 (as in Figma)
const MARGEN = 12; // horizontal margin of the first and last point

// Weight line chart of "Estadísticas" (green line, filled dots, hollow last dot).
export function GraficaPeso({ puntos }: { puntos: Punto[] }) {
  const [ancho, setAncho] = useState(0);

  const valores = puntos.map((p) => p.kg).filter((k): k is number => k !== null);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const rango = Math.max(1, maximo - minimo); // avoid a flat division by zero

  // x: evenly spaced buckets; y: lower weight = lower on the chart, 10px top padding.
  const x = (i: number) => MARGEN + (i * (ancho - 2 * MARGEN)) / Math.max(1, puntos.length - 1);
  const y = (kg: number) => 10 + ((maximo - kg) / rango) * (ALTO - 10);

  const conDatos = puntos.map((p, i) => ({ ...p, i })).filter((p) => p.kg !== null) as { etiqueta: string; kg: number; i: number }[];
  const ultimo = conDatos[conDatos.length - 1];

  return (
    <View onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
      {ancho > 0 && (
        <Svg width={ancho} height={ALTO + 8}>
          {[0, ALTO / 2, ALTO].map((gy) => (
            <Line key={gy} x1={0} x2={ancho} y1={gy + 4} y2={gy + 4} stroke="#262626" strokeWidth={1} />
          ))}
          {conDatos.length > 1 && (
            <Polyline
              points={conDatos.map((p) => `${x(p.i)},${y(p.kg) + 4}`).join(' ')}
              fill="none"
              stroke={Colores.verde}
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {conDatos.map((p) =>
            p === ultimo ? (
              <Circle key={p.i} cx={x(p.i)} cy={y(p.kg) + 4} r={5} fill="#000" stroke={Colores.verde} strokeWidth={3} />
            ) : (
              <Circle key={p.i} cx={x(p.i)} cy={y(p.kg) + 4} r={4} fill={Colores.verde} />
            ),
          )}
        </Svg>
      )}
      <View style={styles.etiquetas}>
        {puntos.map((p, i) => (
          <Text key={`${p.etiqueta}-${i}`} style={[styles.etiqueta, { left: ancho ? x(i) - 15 : 0 }]}>
            {p.etiqueta}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  etiquetas: { height: 16, marginTop: 6 },
  etiqueta: {
    position: 'absolute',
    width: 30,
    textAlign: 'center',
    fontFamily: Fuentes.regular,
    fontSize: 12,
    color: '#A8A8A8',
  },
});
