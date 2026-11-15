import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colores, Fuentes, Radios } from '@/constants/theme';

// Sliding ruler from Figma ("Tarjeta estatura" / "Tarjeta peso").
// Each unit (1 cm or 1 kg) is 40px wide. The selected value sits under the
// green lens, whose center is 44px from the left edge.
// Ways to change it: swipe (phone), drag with the mouse or use the wheel (web),
// tap a number, the ‹ › arrows, or a screen reader (adjustable).

const PASO = 40; // px per unit
const CENTRO = 44; // x of the green indicator
const ANCHO_VISIBLE = 362;

type Props = {
  etiqueta: string;
  unidad: string;
  min: number;
  max: number;
  valor: number;
  onCambio: (valor: number) => void;
};

export function Regla({ etiqueta, unidad, min, max, valor, onCambio }: Props) {
  const ref = useRef<ScrollViewInstance>(null);
  const total = max - min;
  const anchoContenido = CENTRO + total * PASO + (ANCHO_VISIBLE - CENTRO);

  const limitar = (n: number) => Math.min(max, Math.max(min, n));
  // Where the ruler is heading while it animates (so fast taps on ‹ › add up).
  const meta = useRef<number | null>(null);
  const irA = (n: number, animado = true) => {
    meta.current = animado ? limitar(n) : null;
    ref.current?.scrollTo({ x: (limitar(n) - min) * PASO, animated: animado });
  };
  const paso = (d: number) => irA((meta.current ?? valor) + d);

  // Start scrolled to the initial value.
  useEffect(() => {
    const t = setTimeout(() => irA(valor, false), 0);
    return () => clearTimeout(t);
    // Only on mount: afterwards the ruler drives the value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Web only: a mouse cannot "swipe", so drag and wheel move the ruler by hand.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const nodo = (ref.current as unknown as { getScrollableNode?: () => HTMLElement })?.getScrollableNode?.();
    if (!nodo) return;
    // `movido` = became a real drag (> 4 px). A plain click stays a click (tap a number).
    let arrastre: { x: number; inicio: number; id: number; movido: boolean } | null = null;
    let espera: ReturnType<typeof setTimeout> | undefined;
    // Snap to the nearest unit. (Not nodo.scrollTo: React Native Web replaces it and
    // expects {x}, so {left} would jump back to 0.)
    const ajustar = () => ref.current?.scrollTo({ x: Math.round(nodo.scrollLeft / PASO) * PASO, animated: true });

    const bajar = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return; // touch already scrolls by itself
      arrastre = { x: e.clientX, inicio: nodo.scrollLeft, id: e.pointerId, movido: false };
      e.preventDefault(); // no text selection
    };
    const mover = (e: PointerEvent) => {
      if (!arrastre) return;
      const dx = e.clientX - arrastre.x;
      if (!arrastre.movido && Math.abs(dx) > 4) {
        arrastre.movido = true;
        nodo.setPointerCapture(arrastre.id); // keep dragging even outside the card
      }
      if (arrastre.movido) nodo.scrollLeft = arrastre.inicio - dx;
    };
    const soltar = () => {
      if (!arrastre) return;
      const movido = arrastre.movido;
      arrastre = null;
      if (movido) ajustar();
    };
    const rueda = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // trackpad sideways: native
      e.preventDefault();
      nodo.scrollLeft += e.deltaY;
      clearTimeout(espera);
      espera = setTimeout(ajustar, 120);
    };
    nodo.style.cursor = 'grab';
    nodo.addEventListener('pointerdown', bajar);
    nodo.addEventListener('pointermove', mover);
    nodo.addEventListener('pointerup', soltar);
    nodo.addEventListener('pointercancel', soltar);
    nodo.addEventListener('wheel', rueda, { passive: false });
    return () => {
      clearTimeout(espera);
      nodo.removeEventListener('pointerdown', bajar);
      nodo.removeEventListener('pointermove', mover);
      nodo.removeEventListener('pointerup', soltar);
      nodo.removeEventListener('pointercancel', soltar);
      nodo.removeEventListener('wheel', rueda);
    };
  }, []);

  const alDesplazar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nuevo = limitar(min + Math.round(e.nativeEvent.contentOffset.x / PASO));
    if (nuevo === meta.current) meta.current = null; // arrived
    if (nuevo !== valor) onCambio(nuevo);
  };

  return (
    <View
      style={styles.tarjeta}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={etiqueta}
      accessibilityValue={{ min, max, now: valor, text: `${valor} ${unidad}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => paso(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
      <View style={styles.cabecera}>
        <Text style={styles.etiqueta}>{etiqueta}</Text>
        <Text style={styles.unidad}>{unidad}</Text>
        <View style={styles.ayuda}>
          <Pressable onPress={() => paso(-1)} hitSlop={10} accessibilityLabel={`Menos ${unidad}`}>
            <Text style={styles.flecha}>‹</Text>
          </Pressable>
          <Text style={styles.textoAyuda}>Desliza para ajustar</Text>
          <Pressable onPress={() => paso(1)} hitSlop={10} accessibilityLabel={`Más ${unidad}`}>
            <Text style={styles.flecha}>›</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.selector}>
        <ScrollView
          ref={ref}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={PASO}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={alDesplazar}>
          <View style={{ width: anchoContenido, height: 66 }}>
            {Array.from({ length: total + 1 }, (_, i) => {
              const numero = min + i;
              const x = CENTRO + i * PASO;
              const mayor = numero % 5 === 0;
              const elegido = numero === valor;
              return (
                <View key={numero}>
                  <Text
                    onPress={() => irA(numero)}
                    style={[
                      styles.numero,
                      mayor || elegido ? styles.numeroMayor : styles.numeroMenor,
                      { left: x - 20 },
                    ]}>
                    {numero}
                  </Text>
                  <View style={[mayor ? styles.marcaMayor : styles.marcaMenor, { left: x - 1 }]} />
                  {i < total && <View style={[styles.marcaMedia, { left: x + PASO / 2 - 0.5 }]} />}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Fixed overlays on top of the ruler */}
        <LinearGradient
          colors={['rgba(22,22,22,0)', Colores.fondo2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.desvanecido}
          pointerEvents="none"
        />
        <View style={styles.lente} pointerEvents="none" />
        <View style={styles.indicador} pointerEvents="none" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    height: 112,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    borderRadius: Radios.tarjeta,
    overflow: 'hidden',
    userSelect: 'none', // web: selecting text used to slide the whole card
  },
  cabecera: { flexDirection: 'row', alignItems: 'baseline', paddingTop: 11, paddingHorizontal: 15, height: 39 },
  etiqueta: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.texto },
  unidad: { fontFamily: Fuentes.semiBold, fontSize: 12, color: Colores.textoApagado, marginLeft: 6 },
  ayuda: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto' },
  textoAyuda: { fontFamily: Fuentes.medium, fontSize: 11, color: '#6F6F6F' },
  flecha: { fontFamily: Fuentes.bold, fontSize: 18, lineHeight: 18, color: Colores.textoSecundario, paddingHorizontal: 4 },

  selector: { height: 66, marginLeft: -1 },
  numero: { position: 'absolute', width: 40, textAlign: 'center' },
  numeroMayor: { top: 6, fontFamily: Fuentes.bold, fontSize: 16, color: Colores.texto },
  numeroMenor: { top: 8, fontFamily: Fuentes.semiBold, fontSize: 14, color: Colores.placeholder },
  marcaMayor: { position: 'absolute', top: 34, width: 2, height: 22, borderRadius: 1, backgroundColor: '#7A7A7A' },
  marcaMenor: { position: 'absolute', top: 38, width: 2, height: 16, borderRadius: 1, backgroundColor: '#4A4A4A' },
  marcaMedia: { position: 'absolute', top: 42, width: 1, height: 9, backgroundColor: '#3A3A3A' },

  desvanecido: { position: 'absolute', right: 0, top: 0, width: 56, height: 66 },
  lente: {
    position: 'absolute',
    left: 16,
    top: 2,
    width: 56,
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colores.verde,
    backgroundColor: 'rgba(30, 255, 60, 0.12)',
  },
  indicador: {
    position: 'absolute',
    left: 42.5,
    top: 32,
    width: 3,
    height: 26,
    borderRadius: 2,
    backgroundColor: Colores.verde,
  },
});
