import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Categoria } from '@/lib/comida';

// 36px icon of a food, built from the Figma pieces (assets/figma/comida).
// Grains = rice bowl, protein = drumstick, vegetables = leaf,
// fruit = apple, other = plate (the last two scaled from the 48px plan icons).
const a = {
  cuadroArroz: require('@/assets/figma/comida/cuadro-arroz.svg'),
  tazon: require('@/assets/figma/comida/arroz-tazon.svg'),
  grano: require('@/assets/figma/comida/arroz-grano.svg'),
  cuadroPollo: require('@/assets/figma/comida/cuadro-pollo.svg'),
  polloA: require('@/assets/figma/comida/pollo-a.svg'),
  polloB: require('@/assets/figma/comida/pollo-b.svg'),
  cuadroEnsalada: require('@/assets/figma/comida/cuadro-ensalada.svg'),
  hojaA: require('@/assets/figma/comida/hoja-a.svg'),
  hojaB: require('@/assets/figma/comida/hoja-b.svg'),
  cuadroFruta: require('@/assets/figma/comida/cuadro-media.svg'),
  manzanaA: require('@/assets/figma/comida/manzana-a.svg'),
  manzanaB: require('@/assets/figma/comida/manzana-b.svg'),
  cuadroOtro: require('@/assets/figma/comida/cuadro-almuerzo.svg'),
  platoA: require('@/assets/figma/comida/plato-a.svg'),
  platoB: require('@/assets/figma/comida/plato-b.svg'),
};

const pos = (left: number, top: number, width: number, height: number) =>
  ({ position: 'absolute', left, top, width, height }) as const;

export function IconoAlimento({ categoria }: { categoria: Categoria }) {
  return (
    <View style={styles.caja}>
      {categoria === 'cereal' && (
        <>
          <Image source={a.cuadroArroz} style={StyleSheet.absoluteFill} />
          <Image source={a.grano} style={pos(9, 12, 6, 6)} />
          <Image source={a.grano} style={pos(15, 10, 6, 6)} />
          <Image source={a.grano} style={pos(21, 12, 6, 6)} />
          <Image source={a.tazon} style={pos(7, 18, 22, 11)} />
        </>
      )}
      {categoria === 'proteina' && (
        <>
          <Image source={a.cuadroPollo} style={StyleSheet.absoluteFill} />
          <Image source={a.polloA} style={pos(14, 6, 16, 16)} />
          <Image source={a.polloB} style={pos(7, 19, 11, 11)} />
        </>
      )}
      {categoria === 'verdura' && (
        <>
          <Image source={a.cuadroEnsalada} style={StyleSheet.absoluteFill} />
          <Image source={a.hojaA} style={pos(8, 8, 22, 22)} />
          <Image source={a.hojaB} style={pos(9.2, 15.2, 13.6, 13.6)} />
        </>
      )}
      {categoria === 'fruta' && (
        <>
          <Image source={a.cuadroFruta} style={StyleSheet.absoluteFill} />
          <Image source={a.manzanaA} style={pos(9.75, 10, 16.5, 15.25)} />
          <Image source={a.manzanaB} style={pos(18, 6, 3.75, 4.5)} />
        </>
      )}
      {categoria === 'otro' && (
        <>
          <Image source={a.cuadroOtro} style={StyleSheet.absoluteFill} />
          <Image source={a.platoA} style={pos(10.3, 8.8, 18.45, 18.45)} />
          <Image source={a.platoB} style={pos(15.75, 14.25, 7.5, 7.5)} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { width: 36, height: 36 },
});
