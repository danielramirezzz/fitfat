import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { Pantalla } from '@/components/pantalla';
import { Text } from '@/components/texto';
import { Boton } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { avisar } from '@/lib/avisos';
import { recordarCuenta, tomarCredencial } from '@/lib/google';
import { cerrarSesion, entrarConGoogle, entrarConGoogleDemo } from '@/lib/sesion';

const img = {
  simbolo: require('@/assets/figma/acceso/simbolo.png'),
  anillo: require('@/assets/figma/google/anillo.svg'),
  arco: require('@/assets/figma/google/arco.svg'),
  pasos: require('@/assets/figma/google/pasos.svg'),
  hecho: require('@/assets/figma/google/paso-hecho.svg'),
  hechoCheck: require('@/assets/figma/google/paso-hecho-check.svg'),
  actual: require('@/assets/figma/google/paso-actual.svg'),
  actualPunto: require('@/assets/figma/google/paso-actual-punto.svg'),
  pendiente: require('@/assets/figma/google/paso-pendiente.svg'),
};

const PASOS = ['Cuenta de Google conectada', 'Verificando tus datos…', 'Encendiendo tu fueguito'];
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Paso({ texto, estado }: { texto: string; estado: 'hecho' | 'actual' | 'pendiente' }) {
  return (
    <View style={styles.paso}>
      <View style={styles.marca}>
        {estado === 'hecho' && (
          <>
            <Image source={img.hecho} style={{ position: 'absolute', width: 24, height: 24 }} />
            <Image source={img.hechoCheck} style={{ width: 14.4, height: 10.4 }} />
          </>
        )}
        {estado === 'actual' && (
          <>
            <Image source={img.actual} style={StyleSheet.absoluteFill} />
            <Image source={img.actualPunto} style={{ width: 8, height: 8 }} />
          </>
        )}
        {estado === 'pendiente' && <Image source={img.pendiente} style={StyleSheet.absoluteFill} />}
      </View>
      <Text
        style={[
          styles.pasoTexto,
          estado === 'actual' && { color: Colores.verde },
          estado === 'pendiente' && { color: Colores.textoApagado },
        ]}>
        {texto}
      </Text>
    </View>
  );
}

// "Pantalla validar autenticación": creates or opens the FitFat account.
export default function ValidarGoogle() {
  const { nombre, correo, modo } = useLocalSearchParams<{ nombre: string; correo: string; modo?: string }>();
  const [paso, setPaso] = useState(1); // 0-based index of the step in progress
  const cancelado = useRef(false);
  const [giro] = useState(() => new Animated.Value(0)); // spinner rotation (0 → 1 = one turn)

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.timing(giro, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
    );
    animacion.start();

    (async () => {
      try {
        let entrada;
        if (modo === 'real') {
          const credencial = tomarCredencial();
          if (!credencial) throw new Error('Vuelve a tocar "Continuar con Google".');
          entrada = entrarConGoogle(credencial); // the server checks the token with Google
        } else {
          entrada = entrarConGoogleDemo(nombre ?? '', correo ?? '');
        }
        const [r] = await Promise.all([entrada, esperar(1200)]);
        if (cancelado.current) return void cerrarSesion();
        if (modo !== 'real') await recordarCuenta({ nombre: r.usuario.nombre ?? nombre ?? '', correo: correo ?? '' });
        setPaso(2);
        await esperar(900);
        if (cancelado.current) return void cerrarSesion();
        setPaso(3);
        if (r.nueva) router.replace('/usuario-creado'); // logro "Primer paso" → Datos
        else router.replace(r.usuario.perfilCompleto ? '/inicio' : '/datos');
      } catch (e) {
        if (cancelado.current) return;
        avisar('No se pudo validar tu cuenta', e instanceof Error ? e.message : 'Inténtalo de nuevo.');
        router.back();
      }
    })();

    return () => animacion.stop();
  }, [giro, nombre, correo, modo]);

  const cancelar = () => {
    cancelado.current = true;
    router.back();
  };

  const rotacion = giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <Image source={img.simbolo} style={styles.simbolo} contentFit="cover" accessibilityLabel="FitFat" />

      <View style={styles.cargador} accessibilityRole="progressbar" accessibilityLabel="Validando">
        <Image source={img.anillo} style={StyleSheet.absoluteFill} />
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotacion }] }]}>
          <Image source={img.arco} style={styles.arco} />
        </Animated.View>
      </View>

      <Text style={styles.titulo} accessibilityRole="header">
        Validando tu cuenta…
      </Text>
      <Text style={styles.sub}>Esto solo toma unos segundos.</Text>

      <View style={styles.pasos}>
        <Image source={img.pasos} style={StyleSheet.absoluteFill} />
        {PASOS.map((t, i) => (
          <Paso key={t} texto={t} estado={i < paso ? 'hecho' : i === paso ? 'actual' : 'pendiente'} />
        ))}
      </View>

      <Boton texto="Cancelar" variante="gris" onPress={cancelar} estilo={styles.cancelar} />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { flexGrow: 1, paddingTop: 50, paddingBottom: 60 },
  simbolo: { width: 96, height: 96, alignSelf: 'center' },
  cargador: { width: 96, height: 96, alignSelf: 'center', marginTop: 70 },
  arco: { position: 'absolute', left: 44, top: -4, width: 56.7, height: 56.7 },
  titulo: { fontFamily: Fuentes.bold, fontSize: 25, color: Colores.texto, textAlign: 'center', marginTop: 26 },
  sub: { fontFamily: Fuentes.regular, fontSize: 15, color: Colores.textoClaro, textAlign: 'center', marginTop: 10 },
  pasos: { width: 331, height: 169, alignSelf: 'center', marginTop: 36, paddingTop: 20, paddingLeft: 18, gap: 22 },
  paso: { flexDirection: 'row', alignItems: 'center' },
  marca: { width: 26.5, height: 26.5, alignItems: 'center', justifyContent: 'center' },
  pasoTexto: { fontFamily: Fuentes.bold, fontSize: 15, color: Colores.texto, marginLeft: 12 },
  cancelar: { marginTop: 'auto', marginHorizontal: 40 },
});
