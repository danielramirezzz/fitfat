import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { FueguitoTriste } from '@/components/iconos-registro';
import { Pantalla } from '@/components/pantalla';
import { Boton, TarjetaAviso } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';

// "Pantalla usuario no creado": shown after "Cancelar registro".
// Persuasive: reminds the user that their streak is waiting.
export default function UsuarioNoCreado() {
  return (
    <Pantalla estiloContenido={styles.contenido}>
      <View style={styles.fueguito}>
        <FueguitoTriste />
      </View>

      <TarjetaAviso estilo={styles.tarjeta}>
        <Text style={styles.titulo}>Usuario no creado</Text>
        <Text style={styles.mensaje}>Cancelaste el registro y no{'\n'}guardamos ningún dato.</Text>
        <Text style={styles.esperando}>¡Tu fueguito te está esperando!</Text>
        <Boton texto="Crear cuenta de nuevo" onPress={() => router.replace('/crear-usuario')} estilo={styles.boton} />
        <Boton
          texto="Volver al inicio de sesión"
          variante="gris"
          onPress={() => router.dismissTo('/login')}
          estilo={styles.botonSecundario}
        />
      </TarjetaAviso>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 44, paddingHorizontal: 36 },
  fueguito: { alignItems: 'center' },
  tarjeta: { marginTop: 54, paddingTop: 30, paddingBottom: 28 },
  titulo: { fontFamily: Fuentes.bold, fontSize: 25, color: Colores.texto, textAlign: 'center' },
  mensaje: {
    fontFamily: Fuentes.regular,
    fontSize: 15,
    lineHeight: 21,
    color: '#D0D0D0',
    textAlign: 'center',
    marginTop: 14,
  },
  esperando: { fontFamily: Fuentes.bold, fontSize: 15, color: '#FF8A00', textAlign: 'center', marginTop: 8 },
  boton: { alignSelf: 'stretch', marginTop: 20 },
  botonSecundario: { alignSelf: 'stretch', marginTop: 12 },
});
