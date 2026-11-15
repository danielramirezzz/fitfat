import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// Graphics of "Usuario creado" / "Usuario no creado", built from the Figma SVGs
// in assets/figma/registro/. Positions are the Figma ones (402px-wide frame),
// shifted so the drawing starts at y = 70.

// Medal with ribbons and confetti ("LOGRO DESBLOQUEADO").
export const MedallaLogro = () => (
  <Svg width="100%" height={220} viewBox="0 70 402 220" preserveAspectRatio="xMidYMid meet">
    <Defs>
      <LinearGradient id="oro" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
        <Stop stopColor="#FFE066" />
        <Stop offset="1" stopColor="#FFA000" />
      </LinearGradient>
    </Defs>

    {/* Confetti: rotated pills */}
    <Rect x={69.8} y={95.9} width={12} height={5} rx={2.5} fill="#FFD000" transform="rotate(30 75.8 98.4)" />
    <Rect x={300.2} y={88} width={12} height={5} rx={2.5} fill="#1EFF3C" transform="rotate(-25 306.2 90.5)" />
    <Rect x={329.6} y={199.8} width={12} height={5} rx={2.5} fill="#A259FF" transform="rotate(50 335.6 202.3)" />
    <Rect x={58.3} y={213.9} width={12} height={5} rx={2.5} fill="#2D9CFF" transform="rotate(-40 64.3 216.4)" />
    {/* Confetti: dots */}
    <Circle cx={110} cy={150} r={4} fill="#FF3B5C" />
    <Circle cx={296} cy={150} r={4} fill="#FFD000" />
    <Circle cx={88} cy={260} r={3} fill="#1EFF3C" />
    <Circle cx={320} cy={262} r={3} fill="#FF8A00" />
    <Circle cx={150} cy={84} r={3} fill="#2D9CFF" />
    <Circle cx={256} cy={80} r={3} fill="#FF3B5C" />

    {/* Ribbons (behind the medal) */}
    <G transform="translate(162 228)">
      <Path d="M16 0L0 54L22 45L35 62L43 4L16 0Z" fill="#1EFF3C" />
    </G>
    <G transform="translate(197 228)">
      <Path d="M27 0L43 54L21 45L8 62L0 4L27 0Z" fill="#13B82B" />
    </G>

    {/* Medal */}
    <G transform="translate(141 126)">
      <Path d="M60 120C93.1371 120 120 93.1371 120 60C120 26.8629 93.1371 0 60 0C26.8629 0 0 26.8629 0 60C0 93.1371 26.8629 120 60 120Z" fill="url(#oro)" />
      <G transform="translate(12.5 12.5)">
        <Path fill="none" d="M93.5 47.5C93.5 72.9051 72.9051 93.5 47.5 93.5C22.0949 93.5 1.5 72.9051 1.5 47.5C1.5 22.0949 22.0949 1.5 47.5 1.5C72.9051 1.5 93.5 22.0949 93.5 47.5Z" stroke="#FFF3B0" strokeWidth={3} />
      </G>
      <G transform="translate(35.3 34)">
        <Path d="M24.7 0L31.2 17.1L49.4 18L35.2 29.4L40 47L24.7 37L9.39999 47L14.2 29.4L0 18L18.2 17.1L24.7 0Z" fill="white" />
      </G>
    </G>
  </Svg>
);

// Grey, sad fueguito with smoke and a tear (the streak is "off").
export const FueguitoTriste = () => (
  <Svg width={57.2} height={111.15} viewBox="0 0 57.2 111.15">
    <Defs>
      <LinearGradient id="gris" x1="0" y1="22.75" x2="0" y2="111.15" gradientUnits="userSpaceOnUse">
        <Stop stopColor="#8A93A6" />
        <Stop offset="1" stopColor="#454B59" />
      </LinearGradient>
    </Defs>
    <Path fill="none" d="M28.6 14.95C23.4 9.75 33.8 7.15 28.6 1.95" stroke="#6B7385" strokeWidth={3.9} strokeLinecap="round" />
    <Path d="M28.6 22.75C36.4 38.35 57.2 48.75 57.2 74.75C57.2 95.55 44.2 111.15 28.6 111.15C13 111.15 0 95.55 0 74.75C0 61.75 6.5 52.65 14.3 47.45C14.3 56.55 19.5 61.75 24.7 63.05C22.1 48.75 23.4 34.45 28.6 22.75Z" fill="url(#gris)" />
    <Path d="M28.6 66.95C36.4 74.75 44.2 79.95 44.2 90.35C44.2 100.75 37.18 105.95 28.6 105.95C20.02 105.95 13 100.75 13 90.35C13 82.55 20.8 76.05 28.6 66.95Z" fill="#9AA3B5" />
    <Path fill="none" d="M16.9 87.75C19.5 85.67 22.1 85.67 24.7 87.75M32.5 87.75C35.1 85.67 37.7 85.67 40.3 87.75M20.8 100.75C26 96.4167 31.2 96.4167 36.4 100.75" stroke="#2A2E38" strokeWidth={3.64} strokeLinecap="round" />
    <Path d="M16.9 91.65C14.4733 95.4633 14.4733 98.2367 16.9 99.97C19.3267 98.2367 19.3267 95.4633 16.9 91.65Z" fill="#6EC6FF" />
  </Svg>
);
