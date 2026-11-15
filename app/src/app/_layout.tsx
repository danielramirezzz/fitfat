import { Freeman_400Regular } from '@expo-google-fonts/freeman';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/montserrat';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { Colores } from '@/constants/theme';
import { cargarAccesibilidad } from '@/lib/accesibilidad';
import { prepararSesion } from '@/lib/sesion';

// Keep the splash screen (FitFat logo) up until fonts and session are ready.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [sesionLista, setSesionLista] = useState(false);
  useEffect(() => {
    Promise.all([prepararSesion(), cargarAccesibilidad()]).finally(() => setSesionLista(true));
  }, []);

  const [fuentesListas, error] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Freeman_400Regular,
  });

  const listo = (fuentesListas || !!error) && sesionLista;
  useEffect(() => {
    if (listo) SplashScreen.hideAsync();
  }, [listo]);

  if (!listo) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colores.fondo } }}>
        <Stack.Screen name="(tabs)" />
        {/* No swipe-back during a workout: leaving goes through the X button. */}
        <Stack.Screen name="entreno" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
}
