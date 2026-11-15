import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { FueguitoTriste } from '@/components/iconos-registro';
import { Pantalla } from '@/components/pantalla';
import { Boton, TarjetaAviso } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';

// "Pantalla configuración cancelada".
export default function AlertaCancelada() {
  return (
    <Pantalla estiloContenido={styles.contenido}>
      <View style={{ alignItems: 'center' }}>
        <FueguitoTriste />
      </View>

      <TarjetaAviso estilo={styles.tarjeta}>
        <Text style={styles.titulo} numberOfLines={1} adjustsFontSizeToFit>
          Configuración cancelada
        </Text>
        <Text style={styles.mensaje}>No se guardaron los cambios.{'\n'}Tus recordatorios siguen igual.</Text>
        <Text style={styles.aviso}>Sin alertas, tu racha corre peligro.</Text>
        <Boton
          texto="Volver a configurar"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/alertas'))}
          estilo={styles.boton}
        />
        <Boton texto="Ir al inicio" variante="gris" onPress={() => router.replace('/inicio')} estilo={styles.botonSecundario} />
      </TarjetaAviso>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 44, paddingHorizontal: 36 },
  tarjeta: { marginTop: 54, paddingTop: 30, paddingBottom: 26, paddingHorizontal: 12 },
  titulo: { fontFamily: Fuentes.bold, fontSize: 24, color: Colores.texto, textAlign: 'center' },
  mensaje: { fontFamily: Fuentes.regular, fontSize: 15, lineHeight: 21, color: '#D0D0D0', textAlign: 'center', marginTop: 14 },
  aviso: { fontFamily: Fuentes.bold, fontSize: 14, color: '#FF8A00', textAlign: 'center', marginTop: 12 },
  boton: { alignSelf: 'stretch', marginTop: 20, marginHorizontal: 10 },
  botonSecundario: { alignSelf: 'stretch', marginTop: 12, marginHorizontal: 10 },
});
