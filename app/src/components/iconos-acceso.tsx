import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

// Icons from the access screens, copied as-is from the Figma SVGs
// (assets/figma/acceso/*.svg). Only the color is exposed as a prop where it varies.

type Color = { color?: string };

export const IconoUsuario = ({ color = '#8F8F8F' }: Color) => (
  <Svg width={18} height={19.5} viewBox="0 0 18 19.5">
    <Path d="M9 9C11.4853 9 13.5 6.98528 13.5 4.5C13.5 2.01472 11.4853 0 9 0C6.51472 0 4.5 2.01472 4.5 4.5C4.5 6.98528 6.51472 9 9 9Z" fill={color} />
    <Path d="M0 19.5C0 14.5 4 11.5 9 11.5C14 11.5 18 14.5 18 19.5H0Z" fill={color} />
  </Svg>
);

// Lock = body (14x11) + shackle (10x8) stacked, as in Figma.
export const IconoCandado = ({ color = '#8F8F8F' }: Color) => (
  <Svg width={14} height={19} viewBox="0 0 14 19">
    <Path fill="none"
      d="M3 8V5C3 3.93913 3.42143 2.92172 4.17157 2.17157C4.92172 1.42142 5.93913 1 7 1C8.06087 1 9.07828 1.42142 9.82843 2.17157C10.5786 2.92172 11 3.93913 11 5V8"
      stroke={color}
      strokeWidth={2}
    />
    <Path d="M12 8H2C0.89543 8 0 8.89543 0 10V17C0 18.1046 0.89543 19 2 19H12C13.1046 19 14 18.1046 14 17V10C14 8.89543 13.1046 8 12 8Z" fill={color} />
  </Svg>
);

export const IconoCalendario = ({ color = '#8F8F8F' }: Color) => (
  <Svg width={20} height={22} viewBox="0 -3 20 22">
    <Path fill="none" d="M4 1H16C17.6569 1 19 2.34315 19 4V15C19 16.6569 17.6569 18 16 18H4C2.34315 18 1 16.6569 1 15V4C1 2.34315 2.34315 1 4 1Z" stroke={color} strokeWidth={2} />
    <Path fill="none" d="M1 7H19M6 -2V3M14 -2V3" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const IconoFlecha = ({ color = 'black' }: Color) => (
  <Svg width={16.4} height={14.4} viewBox="0 0 16.4 14.4">
    <Path fill="none" d="M1.2 7.2H15.2M9.2 13.2L15.2 7.2L9.2 1.2" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconoReintentar = ({ color = 'black' }: Color) => (
  <Svg width={18.05} height={18.4} viewBox="0 0 18.0513 18.4">
    <Path fill="none"
      d="M14.851 3.53727C13.6131 2.30194 12.0045 1.50628 10.2714 1.27208C8.53828 1.03787 6.77619 1.37802 5.2548 2.24046C3.7334 3.10291 2.53652 4.44014 1.84736 6.04747C1.15819 7.6548 1.01471 9.44367 1.43886 11.1403C1.86302 12.8369 2.83145 14.3478 4.19593 15.4418C5.56041 16.5357 7.24576 17.1523 8.99402 17.1974C10.7423 17.2424 12.4571 16.7133 13.8761 15.6911C15.2951 14.6689 16.34 13.2098 16.851 11.5373M16.851 1.53727V8.53727H9.85097"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const IconoVolver = () => (
  <Svg width={44} height={44} viewBox="0 0 44 44">
    <Path d="M22 44C34.1503 44 44 34.1503 44 22C44 9.84974 34.1503 0 22 0C9.84974 0 0 9.84974 0 22C0 34.1503 9.84974 44 22 44Z" fill="#1F1F1F" />
    <Path fill="none" d="M26 14L18 22L26 30" stroke="white" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Red cloud with an X, inside a dark-red circle (error screen).
export const IconoErrorNube = () => (
  <Svg width={76} height={76} viewBox="0 0 76 76">
    <Path d="M38 76C58.9868 76 76 58.9868 76 38C76 17.0132 58.9868 0 38 0C17.0132 0 0 17.0132 0 38C0 58.9868 17.0132 76 38 76Z" fill="#3A0A0E" />
    <G transform="translate(6 12)">
      <Path
        d="M11.0416 36.1647C7.85903 35.8995 4.91214 34.3809 2.84924 31.9429C0.786342 29.5049 -0.223592 26.3473 0.0416248 23.1647C0.306841 19.9821 1.82548 17.0352 4.26346 14.9723C6.70143 12.9094 9.85903 11.8995 13.0416 12.1647C13.8335 8.95749 15.5987 6.074 18.0949 3.91014C20.5911 1.74627 23.6959 0.408133 26.9831 0.0794188C30.2702 -0.249296 33.5785 0.447545 36.4538 2.07426C39.3291 3.70098 41.6303 6.17781 43.0416 9.16472C45.8264 7.97124 48.9712 7.9329 51.7843 9.05812C54.5973 10.1833 56.8482 12.3799 58.0416 15.1647C59.2351 17.9495 59.2734 21.0943 58.1482 23.9074C57.023 26.7204 54.8264 28.9712 52.0416 30.1647L11.0416 36.1647Z"
        fill="#FF3B30"
      />
    </G>
    <G transform="translate(30.5 28.5)">
      <Path fill="none" d="M1.5 1.5L13.5 13.5M13.5 1.5L1.5 13.5" stroke="#1C1C1C" strokeWidth={3} strokeLinecap="round" />
    </G>
  </Svg>
);

export const IconoRacha = () => (
  <Svg width={15.4} height={23.65} viewBox="0 0 15.4 23.65">
    <Defs>
      <LinearGradient id="racha" x1="0" y1="0" x2="0" y2="23.65" gradientUnits="userSpaceOnUse">
        <Stop stopColor="#FFB800" />
        <Stop offset="1" stopColor="#FF3D00" />
      </LinearGradient>
    </Defs>
    <Path d="M7.7 2.44379e-05C9.9 4.40002 15.4 7.15002 15.4 14.3C15.4 19.525 11.935 23.65 7.7 23.65C3.465 23.65 0 19.525 0 14.3C0 10.725 1.925 7.97502 3.85 6.32502C3.85 9.07502 5.225 10.45 6.6 10.725C5.775 6.60002 6.325 3.02502 7.7 2.44379e-05Z" fill="url(#racha)" />
    <Path d="M7.7 10.45C9.9 12.925 12.1 14.575 12.1 17.6C12.1 20.35 10.12 22 7.7 22C5.28 22 3.3 20.35 3.3 17.6C3.3 15.125 5.5 13.475 7.7 10.45Z" fill="#FFD84D" />
  </Svg>
);

// Green square with a black dumbbell.
export const IconoCuadroRutinas = () => (
  <Svg width={22} height={22} viewBox="0 0 22 22">
    <Path d="M15 0H7C3.13401 0 0 3.13401 0 7V15C0 18.866 3.13401 22 7 22H15C18.866 22 22 18.866 22 15V7C22 3.13401 18.866 0 15 0Z" fill="#1EFF3C" />
    <G transform="translate(3.85 7.1)">
      <Path d="M6.07967e-06 1.95H1.95001V5.85H6.07967e-06V1.95ZM1.95001 0H4.55001V7.8H1.95001V0ZM4.55001 2.925H9.75001V4.875H4.55001V2.925ZM9.75001 0H12.35V7.8H9.75001V0ZM12.35 1.95H14.3V5.85H12.35V1.95Z" fill="black" />
    </G>
  </Svg>
);

// Orange square with a white apple.
export const IconoCuadroComida = () => (
  <Svg width={22} height={22} viewBox="0 0 22 22">
    <Path d="M15 0H7C3.13401 0 0 3.13401 0 7V15C0 18.866 3.13401 22 7 22H15C18.866 22 22 18.866 22 15V7C22 3.13401 18.866 0 15 0Z" fill="#FF8A00" />
    <G transform="translate(5.5 5.93)">
      <Path d="M5.5 0.644444C4 -0.555556 0 -0.355556 0 3.64444C0 6.64444 2.2 10.1444 4 10.1444C4.7 10.1444 5 9.74442 5.5 9.74442C6 9.74442 6.3 10.1444 7 10.1444C8.8 10.1444 11 6.64444 11 3.64444C11 -0.355556 7 -0.555556 5.5 0.644444Z" fill="white" />
    </G>
  </Svg>
);

// Decorative zigzag at the bottom of Login and Error.
export const Zigzag = () => (
  <Svg width="100%" height={114} viewBox="0 0 402 114" preserveAspectRatio="none">
    <Path d="M0 0L40 20L80 0L120 20L160 0L200 20L240 0L280 20L320 0L360 20L400 0L402 1V15L400 14L360 34L320 14L280 34L240 14L200 34L160 14L120 34L80 14L40 34L0 14V0Z" fill="#1A1A1A" />
    <Path d="M0 40L40 60L80 40L120 60L160 40L200 60L240 40L280 60L320 40L360 60L400 40L402 41V55L400 54L360 74L320 54L280 74L240 54L200 74L160 54L120 74L80 54L40 74L0 54V40Z" fill="#1A1A1A" />
    <Path d="M0 80L40 100L80 80L120 100L160 80L200 100L240 80L280 100L320 80L360 100L400 80L402 81V95L400 94L360 114L320 94L280 114L240 94L200 114L160 94L120 114L80 94L40 114L0 94V80Z" fill="#1A1A1A" />
  </Svg>
);
