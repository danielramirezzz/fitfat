import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BotonAccesibilidad } from '@/components/boton-accesibilidad';
import { Text } from '@/components/texto';
import { IconoCandado, IconoFlecha, IconoUsuario } from '@/components/iconos-acceso';
import { Pantalla } from '@/components/pantalla';
import { Boton, CampoTexto } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { ErrorApi } from '@/lib/api';
import { avisar } from '@/lib/avisos';
import { iniciarSesion } from '@/lib/sesion';

// "Pantalla Login" from Figma.
export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);

  const entrar = async () => {
    if (cargando) return;
    if (!usuario.trim() || !contrasena) {
      router.push('/error-datos');
      return;
    }
    setCargando(true);
    try {
      const u = await iniciarSesion(usuario.trim(), contrasena);
      setContrasena('');
      // If sign-up was left half-way, ask for the personal data first.
      router.replace(u.perfilCompleto ? '/inicio' : '/datos');
    } catch (e) {
      if (e instanceof ErrorApi && e.estado === 401) router.push('/error-datos');
      else avisar('Sin conexión', e instanceof Error ? e.message : 'Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Pantalla zigzag estiloContenido={styles.contenido}>
      <BotonAccesibilidad tam={40} estilo={styles.accesibilidad} />
      <Image source={require('@/assets/figma/acceso/simbolo.png')} style={styles.simbolo} contentFit="cover" />
      <Image
        source={require('@/assets/figma/acceso/wordmark.png')}
        style={styles.wordmark}
        contentFit="cover"
        accessibilityLabel="FitFat"
      />
      <Text style={styles.lema}>Tú eres tu único rival</Text>

      <View style={styles.formulario}>
        <CampoTexto
          etiqueta="Usuario"
          placeholder="Ingresa tu usuario"
          icono={<IconoUsuario />}
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
        />
        <View style={{ height: 12 }} />
        <CampoTexto
          etiqueta="Contraseña"
          placeholder="Ingresa tu contraseña"
          icono={<IconoCandado />}
          value={contrasena}
          onChangeText={setContrasena}
          secureTextEntry
          textContentType="password"
          onSubmitEditing={entrar}
        />
        <Boton
          texto={cargando ? 'Entrando…' : 'Iniciar sesión'}
          onPress={entrar}
          icono={cargando ? undefined : <IconoFlecha />}
          estilo={{ marginTop: 24 }}
        />
      </View>

      <Pressable onPress={() => router.push('/recuperar')} style={styles.olvidaste} hitSlop={6}>
        <Text style={styles.textoOlvidaste}>¿Olvidaste tu contraseña?</Text>
      </Pressable>

      <View style={styles.filaCrear}>
        <Text style={styles.noTienes}>¿No tienes cuenta? </Text>
        <Pressable onPress={() => router.push('/crear-usuario')} hitSlop={6} style={styles.subrayado}>
          <Text style={styles.creaUna}>Crea una</Text>
        </Pressable>
      </View>

      <View style={styles.separador}>
        <View style={styles.linea} />
        <Text style={styles.textoSeparador}>o continúa con</Text>
        <View style={styles.linea} />
      </View>

      <Boton
        texto="Continuar con Google"
        variante="blanco"
        onPress={() => router.push('/google')}
        izquierda={
          <View style={styles.circuloG}>
            <Text style={styles.letraG}>G</Text>
          </View>
        }
        estilo={{ gap: 12 }}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 10, paddingBottom: 130 },
  simbolo: { width: 96, height: 96, alignSelf: 'center' },
  accesibilidad: { position: 'absolute', top: 10, right: 20, zIndex: 1 },
  wordmark: { width: 170.5, height: 52, alignSelf: 'center', marginTop: 12 },
  lema: {
    fontFamily: Fuentes.bold,
    fontSize: 15,
    color: Colores.textoClaro,
    textAlign: 'center',
    marginTop: 35,
  },
  formulario: { marginTop: 22 },
  olvidaste: { alignSelf: 'center', marginTop: 11, paddingVertical: 3 },
  textoOlvidaste: { fontFamily: Fuentes.bold, fontSize: 13, color: Colores.verde },
  filaCrear: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  noTienes: { fontFamily: Fuentes.regular, fontSize: 14, color: Colores.textoClaro },
  creaUna: { fontFamily: Fuentes.bold, fontSize: 14, color: Colores.verde },
  subrayado: { borderBottomWidth: 1.5, borderBottomColor: Colores.verde },
  separador: { flexDirection: 'row', alignItems: 'center', marginTop: 29, marginBottom: 16, gap: 8 },
  linea: { flex: 1, height: 1, backgroundColor: '#3A3A3A' },
  textoSeparador: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoApagado },
  circuloG: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F3F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letraG: { fontFamily: Fuentes.bold, fontSize: 16, color: '#4285F4' },
});
