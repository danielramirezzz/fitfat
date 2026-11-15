import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Zigzag } from '@/components/iconos-acceso';
import { Colores } from '@/constants/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  zigzag?: boolean; // decorative zigzag at the bottom (Login, Error)
  estiloContenido?: ViewStyle;
};

// Base background shared by every screen: gradient from #2A2A2A to black at 30%.
export function Pantalla({ children, scroll = true, zigzag, estiloContenido }: Props) {
  return (
    <LinearGradient
      colors={[Colores.degradadoArriba, Colores.degradadoAbajo]}
      locations={[0, 0.3]}
      style={styles.fondo}>
      {zigzag && (
        <View style={styles.zigzag} pointerEvents="none">
          <Zigzag />
        </View>
      )}
      <SafeAreaView style={styles.fondo} edges={['top']}>
        <KeyboardAvoidingView style={styles.fondo} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {scroll ? (
            <ScrollView
              contentContainerStyle={[styles.contenido, estiloContenido]}
              keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          ) : (
            children
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1 },
  contenido: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 80 },
  zigzag: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
