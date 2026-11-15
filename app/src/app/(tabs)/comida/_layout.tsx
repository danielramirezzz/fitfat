import { Stack } from 'expo-router';

import { Colores } from '@/constants/theme';

// Food tab: "Registro de alimentos y hábitos" (index) → "Plan de alimentación" (plan).
export default function ComidaLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colores.fondo } }} />;
}
