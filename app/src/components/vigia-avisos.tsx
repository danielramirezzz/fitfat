import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/texto';
import { Colores, Fuentes, Radios } from '@/constants/theme';
import { cerrarAviso, detenerVigia, iniciarVigia, useAvisoActual } from '@/lib/avisador';
import { useSesion } from '@/lib/sesion';

// Starts the reminder "alarm clock" when someone is signed in and draws the banner
// at the top of the screen (over any screen), like a phone notification.
export function VigiaAvisos() {
  const { token } = useSesion();
  const aviso = useAvisoActual();
  const insets = useSafeAreaInsets();
  const [entrada] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!token) return;
    iniciarVigia();
    return detenerVigia;
  }, [token]);

  // Slide in, stay 12 s, slide out.
  useEffect(() => {
    if (!aviso) return;
    entrada.setValue(0);
    Animated.spring(entrada, { toValue: 1, useNativeDriver: false, friction: 8 }).start();
    const t = setTimeout(cerrarAviso, 12000);
    return () => clearTimeout(t);
  }, [aviso, entrada]);

  if (!aviso) return null;
  const desplazamiento = entrada.interpolate({ inputRange: [0, 1], outputRange: [-140, 0] });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.capa, { top: insets.top + 8, transform: [{ translateY: desplazamiento }] }]}>
      <Pressable
        onPress={() => {
          cerrarAviso();
          router.push('/notificaciones');
        }}
        accessibilityRole="alert"
        accessibilityLabel={`${aviso.titulo}. ${aviso.cuerpo}`}
        style={[styles.tarjeta, aviso.premium && styles.premium]}>
        <View style={[styles.icono, aviso.premium && { backgroundColor: '#3A2E0B' }]}>
          <Text style={{ fontSize: 20 }}>{aviso.premium ? '👑' : '🔥'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.app}>{aviso.premium ? 'FITFAT PREMIUM · AHORA' : 'FITFAT · AHORA'}</Text>
          <Text style={styles.titulo} numberOfLines={2}>
            {aviso.titulo}
          </Text>
          <Text style={styles.cuerpo} numberOfLines={3}>
            {aviso.cuerpo}
          </Text>
        </View>
        <Pressable onPress={cerrarAviso} hitSlop={12} accessibilityLabel="Cerrar notificación">
          <Text style={styles.cerrar}>✕</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  capa: { position: 'absolute', left: 12, right: 12, zIndex: 1000, alignItems: 'center' },
  tarjeta: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: Radios.tarjeta + 4,
    backgroundColor: 'rgba(28,28,30,0.97)',
    borderWidth: 1.5,
    borderColor: Colores.verde,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  premium: { borderColor: '#FFC93C' },
  icono: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0F2E14', alignItems: 'center', justifyContent: 'center' },
  app: { fontFamily: Fuentes.etiqueta, fontSize: 11, color: Colores.textoApagado, letterSpacing: 0.5 },
  titulo: { fontFamily: Fuentes.bold, fontSize: 15, color: Colores.texto, marginTop: 2 },
  cuerpo: { fontFamily: Fuentes.regular, fontSize: 13, lineHeight: 18, color: Colores.textoClaro, marginTop: 2 },
  cerrar: { fontFamily: Fuentes.bold, fontSize: 14, color: Colores.textoApagado, padding: 2 },
});
