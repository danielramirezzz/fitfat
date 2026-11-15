import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BotonAccesibilidad } from '@/components/boton-accesibilidad';
import {
  IconoAlertas,
  IconoComida,
  IconoInicio,
  IconoProgreso,
  IconoRutinas,
} from '@/components/iconos-barra';
import { ALTO_BARRA, Colores, Fuentes } from '@/constants/theme';

// Route name -> label and icon, in the same order as Figma.
const PESTANAS: Record<string, { etiqueta: string; Icono: typeof IconoInicio }> = {
  inicio: { etiqueta: 'Inicio', Icono: IconoInicio },
  rutinas: { etiqueta: 'Rutinas', Icono: IconoRutinas },
  comida: { etiqueta: 'Comida', Icono: IconoComida },
  progreso: { etiqueta: 'Progreso', Icono: IconoProgreso },
  alertas: { etiqueta: 'Alertas', Icono: IconoAlertas },
};

// Bottom bar from the Figma "Barra navegacion" component.
export function BarraNavegacion({ state, navigateToTab, insets }: BottomTabBarProps) {
  const { bottom } = insets;

  return (
    <View style={[styles.barra, { height: ALTO_BARRA + bottom, paddingBottom: bottom }]}>
      {state.routes.map((ruta, i) => {
        const pestana = PESTANAS[ruta.name];
        if (!pestana) return null;
        // The notifications inbox and the profile have no tab of their own: Inicio stays highlighted (as in Figma).
        const actual = state.routes[state.index].name;
        const activa = state.index === i || (ruta.name === 'inicio' && (actual === 'notificaciones' || actual === 'perfil'));
        const color = activa ? Colores.verde : Colores.textoApagado;

        return (
          <Pressable
            key={ruta.key}
            onPress={() => !activa && navigateToTab(ruta.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa }}
            accessibilityLabel={pestana.etiqueta}
            style={styles.pestana}>
            <View style={[styles.pildora, activa && styles.pildoraActiva]}>
              <pestana.Icono color={color} />
            </View>
            <Text style={[styles.etiqueta, { color }]}>{pestana.etiqueta}</Text>
          </Pressable>
        );
      })}
      {/* Floating accessibility button, just above the bar (on every tab screen). */}
      <BotonAccesibilidad estilo={styles.accesibilidad} />
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: Colores.fondo,
    borderTopWidth: 1,
    borderTopColor: Colores.bordeBarra,
  },
  pestana: { flex: 1, alignItems: 'center', paddingTop: 7 },
  accesibilidad: { position: 'absolute', right: 16, top: -62 },
  pildora: {
    width: 52,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pildoraActiva: { backgroundColor: Colores.verdeSuave },
  etiqueta: { fontFamily: Fuentes.etiqueta, fontSize: 13, marginTop: 7 },
});
