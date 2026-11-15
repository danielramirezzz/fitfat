import { Stack } from 'expo-router';

import { Colores } from '@/constants/theme';

// Profile (inside the tabs, so it keeps the bar as in Figma): "Mi perfil" (index) → "Mis logros".
export default function PerfilLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colores.fondo } }} />;
}
