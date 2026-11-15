import { Alert, Platform } from 'react-native';

// Simple message box that also works in the browser.
export function avisar(titulo: string, texto: string) {
  if (Platform.OS === 'web') window.alert(`${titulo}\n\n${texto}`);
  else Alert.alert(titulo, texto);
}

// Shows a "coming soon" message for flows we have not built yet.
export function proximamente(que: string) {
  avisar('Próximamente', `${que} estará disponible pronto.`);
}
