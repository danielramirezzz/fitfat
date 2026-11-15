import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Pantalla } from '@/components/pantalla';
import { Cabecera } from '@/components/perfil';
import { Text } from '@/components/texto';
import { Colores, Fuentes, Radios } from '@/constants/theme';

// "Política de privacidad": public page (no session needed). Google requires its
// address to publish the "Continuar con Google" app: https://<app>/privacidad
const SECCIONES: { titulo: string; texto: string }[] = [
  {
    titulo: '¿Qué datos guardamos?',
    texto:
      'Tu nombre de usuario, tu contraseña cifrada (nadie puede leerla, ni siquiera nosotros), tu nombre, correo, fecha de nacimiento, género, estatura, peso y objetivo. También lo que registras en la app: rutinas, comidas, agua, sueño, peso, recordatorios, puntos, racha y logros.',
  },
  {
    titulo: 'Si entras con Google',
    texto:
      'Google nos comparte solo tu nombre, tu correo y tu foto de perfil. Los usamos únicamente para crear y abrir tu cuenta de FitFat. No pedimos acceso a tu Gmail, contactos, archivos ni a nada más de tu cuenta de Google.',
  },
  {
    titulo: '¿Para qué los usamos?',
    texto:
      'Para que la app funcione: calcular tu racha, puntos y logros, armar tu plan de comidas, mostrar tu progreso y enviarte los recordatorios que tú configures. No vendemos ni compartimos tus datos con nadie y no mostramos publicidad.',
  },
  {
    titulo: '¿Dónde se guardan?',
    texto:
      'En nuestra base de datos en la nube (Turso), protegida con contraseña y conexión cifrada (https). Tu foto de perfil y tus preferencias de accesibilidad se quedan solo en tu dispositivo.',
  },
  {
    titulo: 'Tus derechos',
    texto:
      'Puedes ver y cambiar tus datos en Perfil → Editar perfil, y cerrar sesión cuando quieras. Si quieres que borremos tu cuenta y todos tus datos, escríbele al equipo de FitFat y lo hacemos.',
  },
  {
    titulo: 'Contacto',
    texto:
      'FitFat es un proyecto académico de la asignatura de UI/UX, Facultad de Ingeniería, Universidad de Ibagué. Equipo: Daniel Felipe Ramírez Murillo, Cristopher Alejandro Santana Lugo y Juan Pablo Prada Chavarro.',
  },
];

export default function Privacidad() {
  return (
    <Pantalla estiloContenido={styles.contenido}>
      <Cabecera titulo="Privacidad" alVolver={() => (router.canGoBack() ? router.back() : router.replace('/login'))} />
      <Text style={styles.intro}>
        Política de privacidad de FitFat · Última actualización: 15 de noviembre de 2026
      </Text>
      {SECCIONES.map((s) => (
        <View key={s.titulo} style={styles.tarjeta}>
          <Text style={styles.titulo} accessibilityRole="header">
            {s.titulo}
          </Text>
          <Text style={styles.texto}>{s.texto}</Text>
        </View>
      ))}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 16 },
  intro: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoSecundario, marginTop: 14, marginBottom: 6 },
  tarjeta: {
    marginTop: 12,
    padding: 16,
    borderRadius: Radios.tarjeta,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
  },
  titulo: { fontFamily: Fuentes.bold, fontSize: 16, color: Colores.verde },
  texto: { fontFamily: Fuentes.regular, fontSize: 14, lineHeight: 21, color: Colores.textoClaro, marginTop: 6 },
});
