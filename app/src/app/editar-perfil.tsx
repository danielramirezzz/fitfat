import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Pantalla } from '@/components/pantalla';
import { Avatar, Cabecera } from '@/components/perfil';
import { Text } from '@/components/texto';
import { Boton, CampoTexto } from '@/components/ui';
import { Colores, Fuentes, Radios } from '@/constants/theme';
import { cargarConfig, ConfigAlertas, FRECUENCIAS, horaBonita } from '@/lib/alertas';
import { avisar } from '@/lib/avisos';
import { cargarPerfil, conComa, editarPerfil, elegirFoto, numero, useFoto } from '@/lib/perfil';
import { useSesion } from '@/lib/sesion';
import { ErrorApi } from '@/lib/api';

const img = {
  usuario: require('@/assets/figma/perfil/icono-usuario.svg'),
  correo: require('@/assets/figma/perfil/icono-correo.svg'),
  campana: require('@/assets/figma/perfil/campana-verde.svg'),
};

const OBJETIVOS = ['Perder peso', 'Ganar músculo', 'Mantenerme'];

type Errores = Partial<Record<'nombre' | 'correo' | 'peso' | 'estatura', string>>;

// "Pantalla editar perfil"
export default function EditarPerfil() {
  const { usuario } = useSesion();
  const foto = useFoto(usuario?.id);
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [correo, setCorreo] = useState(usuario?.correo ?? '');
  const [peso, setPeso] = useState(usuario?.peso ? conComa(usuario.peso) : '');
  const [estatura, setEstatura] = useState(usuario?.estatura ? conComa(usuario.estatura / 100, 2) : '');
  const [objetivo, setObjetivo] = useState(usuario?.objetivo ?? 'Perder peso');
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);
  const [alertas, setAlertas] = useState<ConfigAlertas | null>(null);

  // If the page was reloaded, the user data arrives a moment later: fill the
  // form once when it does ("adjust state during render" pattern).
  const [rellenado, setRellenado] = useState(!!usuario);
  if (!rellenado && usuario) {
    setRellenado(true);
    setNombre(usuario.nombre ?? '');
    setCorreo(usuario.correo ?? '');
    setPeso(usuario.peso ? conComa(usuario.peso) : '');
    setEstatura(usuario.estatura ? conComa(usuario.estatura / 100, 2) : '');
    setObjetivo(usuario.objetivo ?? 'Perder peso');
  }

  useEffect(() => {
    cargarPerfil().catch(() => {}); // fresh user data (also after a reload)
    cargarConfig()
      .then(setAlertas)
      .catch(() => {});
  }, []);

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/perfil'));

  const guardar = async () => {
    const kg = numero(peso);
    const metros = numero(estatura);
    const e: Errores = {};
    if (nombre.trim().length < 3) e.nombre = 'Escribe tu nombre (mínimo 3 letras).';
    if (correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) e.correo = 'Ese correo no parece válido.';
    if (!(kg >= 30 && kg <= 250)) e.peso = 'Entre 30 y 250 kg.';
    if (!(metros >= 1.2 && metros <= 2.3)) e.estatura = 'Entre 1,20 y 2,30 m.';
    setErrores(e);
    if (Object.keys(e).length) return;

    setGuardando(true);
    try {
      await editarPerfil({ nombre: nombre.trim(), correo: correo.trim(), peso: kg, estatura: Math.round(metros * 100), objetivo });
      volver();
    } catch (err) {
      avisar('No se pudo guardar', err instanceof ErrorApi ? err.message : 'Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarFoto = async () => {
    if (!usuario) return;
    try {
      await elegirFoto(usuario.id);
    } catch {
      avisar('No se pudo abrir la galería', 'Revisa que FitFat tenga permiso para ver tus fotos.');
    }
  };

  const recordatorio = alertas
    ? alertas.push || alertas.correo || alertas.sms
      ? `${horaBonita(alertas.hora)} · ${FRECUENCIAS.find((f) => f.clave === alertas.frecuencia)?.nombre ?? ''}`
      : 'Apagado · toca para activarlo'
    : '…';

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <Cabecera titulo="Editar perfil" alVolver={volver} />

      <View style={{ marginTop: 20 }}>
        <Avatar foto={foto} />
      </View>
      <Pressable onPress={cambiarFoto} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'center' }}>
        <Text style={styles.cambiarFoto}>Cambiar foto</Text>
      </Pressable>

      <View style={{ gap: 12, marginTop: 14 }}>
        <CampoTexto
          etiqueta="Nombre completo"
          icono={<Image source={img.usuario} style={{ width: 15.33, height: 16.17 }} />}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Tu nombre y apellido"
          autoComplete="name"
          maxLength={80}
          error={errores.nombre}
        />
        <CampoTexto
          etiqueta="Correo electrónico"
          icono={<Image source={img.correo} style={{ width: 17, height: 13.67 }} />}
          value={correo}
          onChangeText={setCorreo}
          placeholder="usuario@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          maxLength={120}
          error={errores.correo}
        />
        <View style={styles.dosColumnas}>
          <View style={{ flex: 1 }}>
            <CampoTexto
              etiqueta="Peso (kg)"
              value={peso}
              onChangeText={setPeso}
              keyboardType="decimal-pad"
              maxLength={5}
              style={{ paddingLeft: 18, paddingRight: 12 }}
              error={errores.peso}
            />
          </View>
          <View style={{ flex: 1 }}>
            <CampoTexto
              etiqueta="Estatura (m)"
              value={estatura}
              onChangeText={setEstatura}
              keyboardType="decimal-pad"
              maxLength={4}
              style={{ paddingLeft: 18, paddingRight: 12 }}
              error={errores.estatura}
            />
          </View>
        </View>
      </View>

      <Text style={styles.etiqueta}>Mi objetivo</Text>
      <View style={styles.objetivos}>
        {OBJETIVOS.map((o) => {
          const activo = o === objetivo;
          return (
            <Pressable
              key={o}
              onPress={() => setObjetivo(o)}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
              style={[styles.objetivo, activo && styles.objetivoActivo]}>
              <Text style={[styles.objetivoTexto, activo && { color: '#000000' }]} numberOfLines={1} adjustsFontSizeToFit>
                {o}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => router.push('/alertas')}
        accessibilityRole="button"
        accessibilityLabel={`Recordatorio diario: ${recordatorio}. Cambiar en Alertas`}
        style={({ pressed }) => [styles.recordatorio, pressed && { opacity: 0.8 }]}>
        <Image source={img.campana} style={{ width: 16.67, height: 16.67 }} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={styles.recordatorioTitulo}>Recordatorio diario</Text>
          <Text style={styles.recordatorioSub}>{recordatorio}</Text>
        </View>
      </Pressable>

      <Boton
        texto={guardando ? 'Guardando…' : 'Guardar cambios'}
        onPress={guardar}
        deshabilitado={guardando}
        estilo={{ marginTop: 40 }}
      />
      <Boton texto="Cancelar" variante="gris" onPress={volver} estilo={{ marginTop: 12 }} />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 16 },
  cambiarFoto: { fontFamily: Fuentes.etiqueta, fontSize: 15, color: Colores.verde, marginTop: 8 },
  dosColumnas: { flexDirection: 'row', gap: 14 },
  etiqueta: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.texto, marginLeft: 4, marginTop: 14, marginBottom: 8 },
  objetivos: { flexDirection: 'row', gap: 7 },
  objetivo: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colores.campo,
    borderWidth: 1,
    borderColor: '#4A4A4A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  objetivoActivo: { backgroundColor: Colores.verde, borderColor: Colores.verde },
  objetivoTexto: { fontFamily: Fuentes.etiqueta, fontSize: 14, color: Colores.texto },
  recordatorio: {
    marginTop: 24,
    height: 64,
    borderRadius: Radios.tarjeta,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  recordatorioTitulo: { fontFamily: Fuentes.bold, fontSize: 15, color: Colores.texto },
  recordatorioSub: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoSecundario, marginTop: 2 },
});
