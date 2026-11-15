import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { Text } from '@/components/texto';
import { Colores, Fuentes } from '@/constants/theme';

// Technique video of each exercise, inside the app (no YouTube).
// Videos from Pexels (free license: they can be downloaded and used in apps
// without paying or giving credit). Key = what the server sends in `video`.
const VIDEOS: Record<string, number> = {
  calentamiento: require('@/assets/videos/calentamiento.mp4'),
  'pecho-1': require('@/assets/videos/pecho-1.mp4'),
  'pecho-2': require('@/assets/videos/pecho-2.mp4'),
  'pecho-3': require('@/assets/videos/pecho-3.mp4'),
  'pecho-4': require('@/assets/videos/pecho-4.mp4'),
  'espalda-1': require('@/assets/videos/espalda-1.mp4'),
  'espalda-2': require('@/assets/videos/espalda-2.mp4'),
  'espalda-3': require('@/assets/videos/espalda-3.mp4'),
  'espalda-4': require('@/assets/videos/espalda-4.mp4'),
  'piernas-1': require('@/assets/videos/piernas-1.mp4'),
  'piernas-2': require('@/assets/videos/piernas-2.mp4'),
  'piernas-3': require('@/assets/videos/piernas-3.mp4'),
  'piernas-4': require('@/assets/videos/piernas-4.mp4'),
  'brazos-1': require('@/assets/videos/brazos-1.mp4'),
  'brazos-2': require('@/assets/videos/brazos-2.mp4'),
  'brazos-3': require('@/assets/videos/brazos-3.mp4'),
  'brazos-4': require('@/assets/videos/brazos-4.mp4'),
  'hombros-1': require('@/assets/videos/hombros-1.mp4'),
  'hombros-2': require('@/assets/videos/hombros-2.mp4'),
  'hombros-3': require('@/assets/videos/hombros-3.mp4'),
  'hombros-4': require('@/assets/videos/hombros-4.mp4'),
  'abdomen-1': require('@/assets/videos/abdomen-1.mp4'),
  'abdomen-2': require('@/assets/videos/abdomen-2.mp4'),
  'abdomen-3': require('@/assets/videos/abdomen-3.mp4'),
  'abdomen-4': require('@/assets/videos/abdomen-4.mp4'),
};

type Props = { clave: string; estilo?: ViewStyle; pausado?: boolean };

// Muted, looping and autoplay, like a GIF of the movement. `key={clave}` in the
// parent makes a new player when the exercise changes.
export function VideoEjercicio({ clave, estilo, pausado = false }: Props) {
  const fuente = VIDEOS[clave] ?? null;
  const player = useVideoPlayer(fuente, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Pause together with the workout timer, and when this screen is not visible
  // (the previous screens stay mounted underneath).
  const [enPantalla, setEnPantalla] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setEnPantalla(true);
      return () => setEnPantalla(false);
    }, []),
  );
  useEffect(() => {
    if (!fuente) return;
    if (pausado || !enPantalla) player.pause();
    else player.play();
  }, [pausado, enPantalla, player, fuente]);

  return (
    <View style={[styles.marco, estilo]}>
      {fuente ? (
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      ) : (
        <Text style={styles.sinVideo}>Video no disponible</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  marco: { overflow: 'hidden', backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  sinVideo: { fontFamily: Fuentes.medium, fontSize: 13, color: Colores.textoApagado },
});
