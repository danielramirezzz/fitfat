import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';

import { BarraNavegacion } from '@/components/barra-navegacion';
import { Colores } from '@/constants/theme';
import { useSesion } from '@/lib/sesion';

// The 5 main sections of the app, each with its own tab.
// Only for signed-in users: without a session, go to Login.
export default function TabsLayout() {
  const { token } = useSesion();
  if (!token) return <Redirect href="/login" />;

  return (
    <Tabs
      tabBar={(props) => <BarraNavegacion {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: Colores.fondo } }}>
      <Tabs.Screen name="inicio" />
      <Tabs.Screen name="rutinas" />
      <Tabs.Screen name="comida" />
      <Tabs.Screen name="progreso" />
      <Tabs.Screen name="alertas" />
      {/* Inbox: part of the tabs (keeps the bar). Our BarraNavegacion only draws the
          5 known tabs, so it gets no button of its own. */}
      <Tabs.Screen name="notificaciones" />
      {/* Profile: same idea, opened from the avatar on Inicio. */}
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
