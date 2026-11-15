import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  tamano: number;
  grosor: number;
  color: string;
  progreso: number; // 0..1, fraction of the ring that is filled
  children?: ReactNode; // content in the center (the time)
};

// Countdown ring of "Rutina en curso" (green) and "Descanso" (blue).
// Track #262626 like in Figma; the colored arc shrinks as time passes.
export function Anillo({ tamano, grosor, color, progreso, children }: Props) {
  const r = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progreso));
  return (
    <View style={{ width: tamano, height: tamano, alignSelf: 'center' }}>
      <Svg width={tamano} height={tamano}>
        <Circle cx={tamano / 2} cy={tamano / 2} r={r} stroke="#262626" strokeWidth={grosor} fill="none" />
        <Circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          stroke={color}
          strokeWidth={grosor}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circunferencia} ${circunferencia}`}
          strokeDashoffset={circunferencia * (1 - p)}
          transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.centro]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center' },
});
