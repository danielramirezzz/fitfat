import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { FueguitoTriste } from '@/components/iconos-registro';
import { Pantalla } from '@/components/pantalla';
import { Boton, TarjetaAviso } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { cargarInicio } from '@/lib/inicio';
import { obtenerRutinaActual } from '@/lib/rutinas';

// "Pantalla rutina cancelada". Persuasive: reminds the user that the streak
// goes out at midnight and offers a shorter routine.
export default function RutinaCancelada() {
  const { origen } = useLocalSearchParams<{ origen?: string }>();
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    cargarInicio()
      .then(({ racha }) => {
        const d = racha.dias;
        if (racha.hoyActivo) setAviso(`Ya entrenaste hoy: tu racha de ${d} ${d === 1 ? 'día' : 'días'} está a salvo.`);
        else if (d > 0) setAviso(`¡Tu racha de ${d} ${d === 1 ? 'día' : 'días'} se apaga\na medianoche si no entrenas!`);
        else setAviso('¡Entrena hoy y enciende tu fueguito!');
      })
      .catch(() => setAviso('¡Tu fueguito te está esperando!'));
  }, []);

  // A shorter version of the same routine (or legs if none was chosen yet).
  const grupo = obtenerRutinaActual()?.grupo ?? 'piernas';

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <View style={{ alignItems: 'center' }}>
        <FueguitoTriste />
      </View>

      <TarjetaAviso estilo={styles.tarjeta}>
        <Text style={styles.titulo}>Rutina cancelada</Text>
        <Text style={styles.mensaje}>
          {origen === 'entreno' ? 'Saliste antes de terminar la rutina.' : 'No se generó ninguna rutina.'}
        </Text>
        <View style={styles.caja}>
          <Text style={styles.aviso}>{aviso || ' '}</Text>
        </View>
        <Boton
          texto="Hacer una de 15 min"
          onPress={() => router.replace({ pathname: '/rutinas/plan', params: { grupo, minutos: '15' } })}
          estilo={styles.boton}
        />
        <Boton
          texto="Elegir otro grupo"
          variante="gris"
          onPress={() => router.replace('/rutinas')}
          estilo={styles.botonSecundario}
        />
      </TarjetaAviso>

      <Pressable onPress={() => router.replace('/inicio')} style={styles.inicio} hitSlop={8}>
        <Text style={styles.textoInicio}>Ir al inicio</Text>
      </Pressable>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 44, paddingHorizontal: 36 },
  tarjeta: { marginTop: 54, paddingTop: 30, paddingBottom: 28 },
  titulo: { fontFamily: Fuentes.bold, fontSize: 25, color: Colores.texto, textAlign: 'center' },
  mensaje: { fontFamily: Fuentes.regular, fontSize: 15, color: '#D0D0D0', textAlign: 'center', marginTop: 14 },
  caja: {
    alignSelf: 'stretch',
    marginTop: 18,
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: '#2A1400',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  aviso: { fontFamily: Fuentes.bold, fontSize: 14, lineHeight: 20, color: '#FF8A00', textAlign: 'center' },
  boton: { alignSelf: 'stretch', marginTop: 22 },
  botonSecundario: { alignSelf: 'stretch', marginTop: 12 },
  inicio: { alignSelf: 'center', marginTop: 28 },
  textoInicio: { fontFamily: Fuentes.bold, fontSize: 14, color: Colores.textoApagado },
});
