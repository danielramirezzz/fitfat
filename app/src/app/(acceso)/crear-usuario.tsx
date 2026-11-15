import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  IconoCandado,
  IconoCuadroComida,
  IconoCuadroRutinas,
  IconoRacha,
  IconoUsuario,
} from '@/components/iconos-acceso';
import { Text } from '@/components/texto';
import { Pantalla } from '@/components/pantalla';
import { BarraPaso, Boton, BotonVolver, CampoTexto } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { ErrorApi } from '@/lib/api';
import { avisar } from '@/lib/avisos';
import { fuerzaContrasena } from '@/lib/registro';
import { registrarse } from '@/lib/sesion';

// Color of the strength bars: 1 weak (red) ... 4 strong (green).
const COLORES_FUERZA = [Colores.rojo, Colores.fuegoOscuro, Colores.fuegoClaro, Colores.verde];
const TEXTO_FUERZA = ['Muy débil', 'Débil', 'Buena', 'Fuerte'];

// "Pantalla crear usuario" (step 1 of 2).
export default function CrearUsuario() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [correo, setCorreo] = useState('');
  const [usuarioOcupado, setUsuarioOcupado] = useState(''); // message from the server
  const [cargando, setCargando] = useState(false);

  const fuerza = fuerzaContrasena(contrasena);
  const usuarioValido = /^[a-zA-Z0-9_.]{3,20}$/.test(usuario);
  const errorUsuario =
    usuario && !usuarioValido ? 'De 3 a 20 caracteres: letras, números, punto o guion bajo' : usuarioOcupado;
  const errorConfirmar = confirmar && confirmar !== contrasena ? 'Las contraseñas no coinciden' : '';
  const correoValido = !correo || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
  const listo = usuarioValido && contrasena.length >= 8 && confirmar === contrasena && correoValido && !cargando;

  // Creates the account on the server (with the +100 welcome points).
  const confirmarPaso = async () => {
    setCargando(true);
    try {
      await registrarse(usuario, contrasena, correo);
      router.replace('/usuario-creado');
    } catch (e) {
      if (e instanceof ErrorApi && e.estado === 409) setUsuarioOcupado(e.message);
      else avisar('No se pudo crear la cuenta', e instanceof Error ? e.message : 'Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const cancelar = () => router.replace('/usuario-no-creado');

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <View style={styles.cabecera}>
        <BotonVolver onPress={() => router.back()} />
        <Text style={styles.paso}>Paso 1 de 2</Text>
      </View>
      <BarraPaso avance={0.5} />

      <Text style={styles.titulo}>Crea tu cuenta</Text>
      <Text style={styles.subtitulo}>Solo te toma un minuto empezar.</Text>

      <View style={styles.formulario}>
        <CampoTexto
          etiqueta="Nombre de usuario"
          placeholder="Crea tu usuario"
          icono={<IconoUsuario />}
          value={usuario}
          onChangeText={(t) => {
            setUsuario(t.trim());
            setUsuarioOcupado('');
          }}
          autoCapitalize="none"
          autoCorrect={false}
          error={errorUsuario}
        />

        <View style={{ height: 12 }} />
        <CampoTexto
          etiqueta="Contraseña (mínimo 8 caracteres)"
          placeholder="Crea tu contraseña"
          icono={<IconoCandado />}
          value={contrasena}
          onChangeText={setContrasena}
          secureTextEntry
          textContentType="newPassword"
        />
        <View style={styles.barrasFuerza}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.barraFuerza, i < fuerza && { backgroundColor: COLORES_FUERZA[fuerza - 1] }]}
            />
          ))}
        </View>
        <Text style={styles.pista}>
          {contrasena ? `${TEXTO_FUERZA[Math.max(fuerza, 1) - 1]} · ` : ''}Usa letras, números y símbolos
        </Text>

        <View style={{ height: 10 }} />
        <CampoTexto
          etiqueta="Confirmar contraseña"
          placeholder="Confirma tu contraseña"
          icono={<IconoCandado />}
          value={confirmar}
          onChangeText={setConfirmar}
          secureTextEntry
          textContentType="newPassword"
          error={errorConfirmar}
        />

        {/* Not in Figma: needed so "¿Olvidaste tu contraseña?" can e-mail a code. */}
        <View style={{ height: 10 }} />
        <CampoTexto
          etiqueta="Correo (opcional)"
          placeholder="Para recuperar tu contraseña"
          icono={<Image source={require('@/assets/figma/recuperar/correo.svg')} style={{ width: 17, height: 13.67 }} />}
          value={correo}
          onChangeText={(t) => setCorreo(t.trim())}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={correoValido ? '' : 'Ese correo no parece válido'}
          onSubmitEditing={() => listo && confirmarPaso()}
        />

        <Boton
          texto={cargando ? 'Creando…' : 'Confirmar'}
          onPress={confirmarPaso}
          deshabilitado={!listo}
          estilo={{ marginTop: 24 }}
        />
      </View>

      {/* Persuasive card: what you gain by signing up */}
      <View style={styles.beneficios}>
        <Text style={styles.tituloBeneficios}>Al crear tu cuenta obtienes:</Text>
        <View style={styles.filaBeneficios}>
          <View style={styles.beneficio}>
            <IconoRacha />
            <Text style={styles.textoBeneficio}>Tu racha</Text>
          </View>
          <View style={styles.beneficio}>
            <IconoCuadroRutinas />
            <Text style={styles.textoBeneficio}>Rutinas</Text>
          </View>
          <View style={styles.beneficio}>
            <IconoCuadroComida />
            <Text style={styles.textoBeneficio}>Plan de comidas</Text>
          </View>
        </View>
        <Text style={styles.puntos}>+100 puntos de bienvenida</Text>
      </View>

      <Pressable onPress={cancelar} style={styles.cancelar} hitSlop={8}>
        <Text style={styles.textoCancelar}>Cancelar registro</Text>
      </Pressable>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 4 },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  paso: { fontFamily: Fuentes.etiqueta, fontSize: 15, color: Colores.textoSecundario },
  titulo: { fontFamily: Fuentes.bold, fontSize: 34, color: Colores.texto, marginTop: 16, marginLeft: 4 },
  subtitulo: { fontFamily: Fuentes.regular, fontSize: 15, color: Colores.textoClaro, marginTop: 8, marginLeft: 4 },
  formulario: { marginTop: 29 },
  barrasFuerza: { flexDirection: 'row', gap: 8.7, marginTop: 12 },
  barraFuerza: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#3A3A3A' },
  pista: { fontFamily: Fuentes.regular, fontSize: 12, color: Colores.placeholder, marginTop: 8, marginLeft: 4 },

  beneficios: {
    marginTop: 40,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 12,
  },
  tituloBeneficios: { fontFamily: Fuentes.etiqueta, fontSize: 15, color: Colores.texto },
  filaBeneficios: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  beneficio: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textoBeneficio: { fontFamily: Fuentes.bold, fontSize: 13, color: '#E6E6E6' },
  puntos: { fontFamily: Fuentes.bold, fontSize: 12, color: Colores.verde, marginTop: 8 },

  cancelar: { alignSelf: 'center', marginTop: 56 },
  textoCancelar: { fontFamily: Fuentes.bold, fontSize: 14, color: Colores.textoApagado },
});
