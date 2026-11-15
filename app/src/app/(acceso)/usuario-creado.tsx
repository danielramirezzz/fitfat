import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { IconoFlecha } from '@/components/iconos-acceso';
import { MedallaLogro } from '@/components/iconos-registro';
import { Pantalla } from '@/components/pantalla';
import { Boton, TarjetaAviso } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { useSesion } from '@/lib/sesion';

// "Pantalla usuario creado": account created, first achievement unlocked.
export default function UsuarioCreado() {
  const { usuario } = useSesion();

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <View style={styles.medalla}>
        <MedallaLogro />
      </View>
      <Text style={styles.logro}>LOGRO DESBLOQUEADO</Text>
      <Text style={styles.nombreLogro}>Primer paso</Text>

      <TarjetaAviso estilo={styles.tarjeta}>
        <Text style={styles.titulo}>¡Cuenta creada!</Text>
        <Text style={styles.mensaje}>
          Tu usuario se creó correctamente.{'\n'}Ahora cuéntanos sobre ti para{'\n'}armar tu plan personalizado.
        </Text>
        <View style={styles.pildora}>
          <Text style={styles.puntos}>+{usuario?.puntos ?? 100} puntos</Text>
        </View>
        <Boton
          texto="Continuar"
          onPress={() => router.replace('/datos')}
          icono={<IconoFlecha />}
          estilo={styles.boton}
        />
      </TarjetaAviso>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 20, paddingHorizontal: 36 },
  // Full screen width (cancels the side padding) so the confetti can spread out.
  medalla: { marginHorizontal: -36, height: 220, overflow: 'hidden' },
  logro: { fontFamily: Fuentes.etiqueta, fontSize: 15, color: '#FFD000', textAlign: 'center', marginTop: 7 },
  nombreLogro: { fontFamily: Fuentes.bold, fontSize: 18, color: Colores.texto, textAlign: 'center', marginTop: 4 },
  tarjeta: { marginTop: 26, paddingTop: 28, paddingBottom: 28 },
  titulo: { fontFamily: Fuentes.bold, fontSize: 26, color: Colores.texto, textAlign: 'center' },
  mensaje: {
    fontFamily: Fuentes.regular,
    fontSize: 15,
    lineHeight: 21,
    color: '#D0D0D0',
    textAlign: 'center',
    marginTop: 14,
  },
  pildora: {
    marginTop: 14,
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#0F2E14',
    justifyContent: 'center',
  },
  puntos: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.verde },
  boton: { alignSelf: 'stretch', marginTop: 24 },
});
