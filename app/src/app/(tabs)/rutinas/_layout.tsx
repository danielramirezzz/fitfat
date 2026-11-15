import { Stack } from 'expo-router';

import { Colores } from '@/constants/theme';

// Routines tab: "Grupo muscular" (index) → "Rutinas y videos" (plan).
// Both keep the bottom tab bar, as in Figma.
export default function RutinasLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colores.fondo } }} />;
}
