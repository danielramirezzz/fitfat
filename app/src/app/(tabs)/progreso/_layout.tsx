import { Stack } from 'expo-router';

import { Colores } from '@/constants/theme';

// Progress tab: "Progreso semanal" (index) → "Estadísticas".
export default function ProgresoLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colores.fondo } }} />;
}
