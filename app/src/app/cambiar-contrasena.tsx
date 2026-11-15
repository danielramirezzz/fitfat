import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconoCandado } from '@/components/iconos-acceso';
import { Pantalla } from '@/components/pantalla';
import { Cabecera } from '@/components/perfil';
import { Text } from '@/components/texto';
import { Boton, CampoTexto } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { ErrorApi } from '@/lib/api';
import { avisar } from '@/lib/avisos';
import { cambiarContrasena } from '@/lib/perfil';

type Errores = Partial<Record<'actual' | 'nueva' | 'repetir', string>>;

// "Cambiar contraseña" (from Ajustes). Not a separate frame in Figma: it reuses
// the fields and buttons of the access screens.
export default function CambiarContrasena() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/ajustes'));

  const guardar = async () => {
    const e: Errores = {};
    if (!actual) e.actual = 'Escribe tu contraseña actual.';
    if (nueva.length < 8) e.nueva = 'Mínimo 8 caracteres.';
    else if (nueva === actual) e.nueva = 'Debe ser diferente a la actual.';
    if (repetir !== nueva) e.repetir = 'Las contraseñas no coinciden.';
    setErrores(e);
    if (Object.keys(e).length) return;

    setGuardando(true);
    try {
      await cambiarContrasena(actual, nueva);
      avisar('Contraseña actualizada', 'Listo. Usa tu nueva contraseña la próxima vez que inicies sesión.');
      volver();
    } catch (err) {
      if (err instanceof ErrorApi && err.estado === 401) setErrores({ actual: err.message });
      else avisar('No se pudo cambiar', err instanceof Error ? err.message : 'Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const candado = <IconoCandado />;

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <Cabecera titulo="Cambiar contraseña" alVolver={volver} />
      <Text style={styles.texto}>Por seguridad, cerraremos tu sesión en los demás dispositivos.</Text>

      <View style={{ gap: 14, marginTop: 24 }}>
        <CampoTexto
          etiqueta="Contraseña actual"
          icono={candado}
          value={actual}
          onChangeText={setActual}
          secureTextEntry
          autoComplete="current-password"
          error={errores.actual}
        />
        <CampoTexto
          etiqueta="Nueva contraseña"
          icono={candado}
          value={nueva}
          onChangeText={setNueva}
          secureTextEntry
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          error={errores.nueva}
        />
        <CampoTexto
          etiqueta="Repite la nueva contraseña"
          icono={candado}
          value={repetir}
          onChangeText={setRepetir}
          secureTextEntry
          autoComplete="new-password"
          error={errores.repetir}
        />
      </View>

      <Boton
        texto={guardando ? 'Guardando…' : 'Guardar contraseña'}
        onPress={guardar}
        deshabilitado={guardando}
        estilo={{ marginTop: 32 }}
      />
      <Boton texto="Cancelar" variante="gris" onPress={volver} estilo={{ marginTop: 12 }} />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 16 },
  texto: { fontFamily: Fuentes.regular, fontSize: 14, color: Colores.textoSecundario, marginTop: 16, lineHeight: 20 },
});
