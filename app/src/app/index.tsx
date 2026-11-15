import { Image } from 'expo-image';
import { Href, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Colores } from '@/constants/theme';
import { restaurarSesion } from '@/lib/sesion';

// Entry point: if a saved session is still valid, skip the login.
export default function Entrada() {
  const [destino, setDestino] = useState<Href | null>(null);

  useEffect(() => {
    restaurarSesion()
      .then((u) => setDestino(!u ? '/login' : u.perfilCompleto ? '/inicio' : '/datos'))
      .catch(() => setDestino('/login'));
  }, []);

  if (destino) return <Redirect href={destino} />;

  return (
    <View style={styles.cargando}>
      <Image source={require('@/assets/figma/acceso/simbolo.png')} style={styles.logo} contentFit="cover" />
      <ActivityIndicator color={Colores.verde} />
    </View>
  );
}

const styles = StyleSheet.create({
  cargando: { flex: 1, backgroundColor: Colores.fondo, alignItems: 'center', justifyContent: 'center', gap: 24 },
  logo: { width: 96, height: 96 },
});
