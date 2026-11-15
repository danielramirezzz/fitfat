import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { BotonVolver } from '@/components/ui';
import { Colores, Fuentes, Radios } from '@/constants/theme';
import { cerrarSesion } from '@/lib/sesion';

const img = {
  anillo: require('@/assets/figma/perfil/avatar-anillo.svg'),
  persona: require('@/assets/figma/perfil/avatar-persona.svg'),
  anilloEditar: require('@/assets/figma/perfil/editar-anillo.svg'),
  personaEditar: require('@/assets/figma/perfil/editar-persona.svg'),
  editarFoto: require('@/assets/figma/perfil/editar-foto.svg'),
  salir: require('@/assets/figma/perfil/salir.svg'),
  csCirculo: require('@/assets/figma/perfil/cs-circulo.svg'),
  csIcono: require('@/assets/figma/perfil/cs-icono.svg'),
};

// Back button + big title ("Mi perfil", "Ajustes", ...).
export function Cabecera({ titulo, alVolver }: { titulo: string; alVolver?: () => void }) {
  const volver = alVolver ?? (() => (router.canGoBack() ? router.back() : router.replace('/inicio')));
  return (
    <View style={styles.cabecera}>
      <BotonVolver onPress={volver} />
      <Text style={styles.titulo} accessibilityRole="header">
        {titulo}
      </Text>
    </View>
  );
}

// Green ring with the user's photo (or the person icon if there is none).
// `grande` = "Mi perfil" (99 px, with the camera badge); otherwise "Editar perfil" (87 px).
export function Avatar({ foto, grande = false, alEditar }: { foto: string | null; grande?: boolean; alEditar?: () => void }) {
  const tam = grande ? 99 : 87;
  return (
    <View style={{ width: tam, height: tam, alignSelf: 'center' }}>
      <Image source={grande ? img.anillo : img.anilloEditar} style={StyleSheet.absoluteFill} />
      {foto ? (
        <Image source={{ uri: foto }} style={[styles.foto, { borderRadius: (tam - 8) / 2 }]} contentFit="cover" />
      ) : (
        <View style={styles.centro}>
          <Image
            source={grande ? img.persona : img.personaEditar}
            style={grande ? { width: 34, height: 36 } : { width: 30, height: 31.745 }}
          />
        </View>
      )}
      {grande && alEditar ? (
        <Pressable
          onPress={alEditar}
          accessibilityRole="button"
          accessibilityLabel="Cambiar foto de perfil"
          hitSlop={8}
          style={styles.insignia}>
          <Image source={img.editarFoto} style={{ width: 33, height: 33 }} />
        </Pressable>
      ) : null}
    </View>
  );
}

// Red "Cerrar sesión" pill (Perfil and Ajustes).
export function BotonCerrarSesion({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.botonSalir, pressed && { opacity: 0.8 }]}>
      <Image source={img.salir} style={{ width: 14.12, height: 16.87 }} />
      <Text style={styles.textoSalir}>Cerrar sesión</Text>
    </Pressable>
  );
}

// "Pantalla cerrar sesión": confirmation on top of the current screen.
export function ModalCerrarSesion({ visible, alCancelar }: { visible: boolean; alCancelar: () => void }) {
  const [saliendo, setSaliendo] = useState(false);
  const salir = async () => {
    setSaliendo(true);
    await cerrarSesion();
    setSaliendo(false);
    alCancelar();
    router.replace('/login');
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={alCancelar}>
      <View style={styles.velo}>
        <View style={styles.tarjeta} accessibilityViewIsModal>
          <View style={styles.circulo}>
            <Image source={img.csCirculo} style={StyleSheet.absoluteFill} />
            <Image source={img.csIcono} style={{ width: 22.46, height: 27.13 }} />
          </View>
          <Text style={styles.pregunta}>¿Cerrar sesión?</Text>
          <Text style={styles.explicacion}>Tu racha y tu progreso quedan guardados. ¡Te esperamos pronto!</Text>
          <Pressable
            onPress={salir}
            disabled={saliendo}
            accessibilityRole="button"
            style={({ pressed }) => [styles.botonModal, { backgroundColor: Colores.rojo, marginTop: 22 }, pressed && { opacity: 0.85 }]}>
            <Text style={styles.textoModal}>{saliendo ? 'Cerrando sesión…' : 'Sí, cerrar sesión'}</Text>
          </Pressable>
          <Pressable
            onPress={alCancelar}
            accessibilityRole="button"
            style={({ pressed }) => [styles.botonModal, styles.botonCancelar, pressed && { opacity: 0.85 }]}>
            <Text style={styles.textoModal}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cabecera: { flexDirection: 'row', alignItems: 'center' },
  titulo: { fontFamily: Fuentes.bold, fontSize: 24, color: Colores.texto, marginLeft: 20 },

  centro: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  foto: { position: 'absolute', left: 4, top: 4, right: 4, bottom: 4 },
  insignia: { position: 'absolute', left: 68, top: 67 },

  botonSalir: {
    height: 52,
    borderRadius: Radios.boton,
    borderWidth: 1,
    borderColor: Colores.rojo,
    backgroundColor: '#2A1414',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  textoSalir: { fontFamily: Fuentes.etiqueta, fontSize: 18, color: Colores.rojo },

  velo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 30 },
  tarjeta: {
    width: '100%',
    maxWidth: 342,
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: 24,
    alignItems: 'center',
    paddingTop: 26,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  circulo: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center' },
  pregunta: { fontFamily: Fuentes.bold, fontSize: 24, color: Colores.texto, marginTop: 12 },
  explicacion: {
    fontFamily: Fuentes.regular,
    fontSize: 14,
    lineHeight: 20,
    color: Colores.textoClaro,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  botonModal: { alignSelf: 'stretch', height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  botonCancelar: { backgroundColor: Colores.campo, borderWidth: 1, borderColor: '#4A4A4A' },
  textoModal: { fontFamily: Fuentes.etiqueta, fontSize: 18, color: Colores.texto },
});
