import Svg, { Path } from 'react-native-svg';

// Bottom-bar icons, copied as-is from the Figma SVGs (assets/figma/nav/*.svg).
// Only the fill color changes: green when active, gray when not.

type Props = { color: string };

export const IconoInicio = ({ color }: Props) => (
  <Svg width={18} height={17} viewBox="0 0 18 17">
    <Path
      d="M0 7L9 0L18 7V16C18 16.2652 17.8946 16.5196 17.7071 16.7071C17.5196 16.8946 17.2652 17 17 17H12V11H6V17H1C0.734784 17 0.48043 16.8946 0.292893 16.7071C0.105357 16.5196 0 16.2652 0 16V7Z"
      fill={color}
    />
  </Svg>
);

export const IconoRutinas = ({ color }: Props) => (
  <Svg width={22} height={12} viewBox="0 0 22 12">
    <Path d="M0 3H3V9H0V3ZM3 0H7V12H3V0ZM7 4.5H15V7.5H7V4.5ZM15 0H19V12H15V0ZM19 3H22V9H19V3Z" fill={color} />
  </Svg>
);

export const IconoComida = ({ color }: Props) => (
  <Svg width={16} height={18.5} viewBox="0 0 16 18.5">
    <Path
      d="M8 4.5C5.8 2.7 0 3.1 0 9C0 13.5 3.3 18.5 6 18.5C7.1 18.5 7.4 17.9 8 17.9C8.6 17.9 8.9 18.5 10 18.5C12.7 18.5 16 13.5 16 9C16 3.1 10.2 2.7 8 4.5ZM8 4.5C8 2.3 9.5 0.5 11.6 0C11.6 2.2 10.1 4 8 4.5Z"
      fill={color}
    />
  </Svg>
);

export const IconoProgreso = ({ color }: Props) => (
  <Svg width={18} height={15.5} viewBox="0 0 18 15.5">
    <Path d="M0 14H18V15.5H0V14ZM2 6H5.5V13H2V6ZM7.25 0H10.75V13H7.25V0ZM12.5 3.5H16V13H12.5V3.5Z" fill={color} />
  </Svg>
);

export const IconoAlertas = ({ color }: Props) => (
  <Svg width={16} height={18} viewBox="0 0 16 18">
    <Path
      d="M8 0C6.4087 0 4.88258 0.632141 3.75736 1.75736C2.63214 2.88258 2 4.4087 2 6V10.5L0 13.5H16L14 10.5V6C14 4.4087 13.3679 2.88258 12.2426 1.75736C11.1174 0.632141 9.5913 0 8 0ZM5.5 15.5C5.5 16.163 5.76339 16.7989 6.23223 17.2678C6.70107 17.7366 7.33696 18 8 18C8.66304 18 9.29893 17.7366 9.76777 17.2678C10.2366 16.7989 10.5 16.163 10.5 15.5H5.5Z"
      fill={color}
    />
  </Svg>
);
