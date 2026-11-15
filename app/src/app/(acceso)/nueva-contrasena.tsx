import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pantalla } from '@/components/pantalla';
import { Cabecera } from '@/components/perfil';
import { EncabezadoRecuperar, estilosRecuperar, PasosRecuperar } from '@/components/recuperar';
import { Text } from '@/components/texto';
import { Boton, CampoTexto } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { avisar } from '@/lib/avisos';
import { guardarNuevaContrasena, obtenerFlujo, reglasContrasena } from '@/lib/recuperar';

const img = {
  circulo: require('@/assets/figma/recuperar/circulo-escudo.svg'),
  escudo: require('@/assets/figma/recuperar/escudo.svg'),
  candado: require('@/assets/figma/recuperar/candado-campo.svg'),
  checkCirculo: require('@/assets/figma/recuperar/check-circulo.svg'),
  check: require('@/assets/figma/recuperar/check-ok.svg'),
};

// "Pantalla nueva contraseña" (step 3 of 3).
export default function NuevaContrasena() {
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [guardando, setGuardando] = useState(false);

  if (!obtenerFlujo()?.token) return <Redirect href="/recuperar" />;

  const reglas = reglasContrasena(nueva, repetir);
  const valida = reglas.every((r) => r.ok);
  const candado = <Image source={img.candado} style={{ width: 13.67, height: 17 }} />;

  const guardar = async () => {
    setGuardando(true);
    try {
      await guardarNuevaContrasena(nueva);
      router.replace('/contrasena-actualizada');
    } catch (e) {
      avisar('No se pudo guardar', e instanceof Error ? e.message : 'Inténtalo de nuevo.');
      setGuardando(false);
    }
  };

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <Cabecera titulo="Nueva contraseña" alVolver={() => router.replace('/login')} />
      <PasosRecuperar paso={3} />

      <EncabezadoRecuperar
        circulo={<Image source={img.circulo} style={{ position: 'absolute', width: 88, height: 88 }} />}
        icono={<Image source={img.escudo} style={{ width: 34.47, height: 38.5 }} />}
        titulo="Crea una nueva contraseña">
        <Text style={estilosRecuperar.explicacion}>Usa una que no hayas usado antes.</Text>
      </EncabezadoRecuperar>

      <View style={{ gap: 12, marginTop: 20 }}>
        <CampoTexto
          etiqueta="Nueva contraseña"
          icono={candado}
          value={nueva}
          onChangeText={setNueva}
          secureTextEntry
          autoComplete="new-password"
          autoFocus
        />
        <CampoTexto
          etiqueta="Confirmar contraseña"
          icono={candado}
          value={repetir}
          onChangeText={setRepetir}
          secureTextEntry
          autoComplete="new-password"
          onSubmitEditing={() => valida && guardar()}
        />
      </View>

      <View style={{ gap: 8, marginTop: 18 }}>
        {reglas.map((r) => (
          <View key={r.texto} style={styles.regla} accessible accessibilityLabel={`${r.texto}: ${r.ok ? 'cumple' : 'pendiente'}`}>
            {r.ok ? (
              <View style={styles.marca}>
                <Image source={img.checkCirculo} style={StyleSheet.absoluteFill} />
                <Image source={img.check} style={{ width: 11.16, height: 8.83 }} />
              </View>
            ) : (
              <View style={[styles.marca, styles.marcaVacia]} />
            )}
            <Text style={[styles.reglaTexto, r.ok && { color: Colores.texto }]}>{r.texto}</Text>
          </View>
        ))}
      </View>

      <Boton
        texto={guardando ? 'Guardando…' : 'Guardar contraseña'}
        onPress={guardar}
        deshabilitado={!valida || guardando}
        estilo={{ marginTop: 44 }}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 16 },
  regla: { flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 2 },
  marca: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  marcaVacia: { borderRadius: 10, borderWidth: 2, borderColor: '#4A4A4A' },
  reglaTexto: { fontFamily: Fuentes.regular, fontSize: 14, color: Colores.textoClaro },
});
