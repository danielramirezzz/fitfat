// Helpers for the sign-up screens.

// Password strength from 0 to 4: length, letters, numbers, symbols.
export function fuerzaContrasena(clave: string): number {
  if (!clave) return 0;
  let puntos = 0;
  if (clave.length >= 8) puntos++;
  if (/[a-zA-ZñÑ]/.test(clave)) puntos++;
  if (/\d/.test(clave)) puntos++;
  if (/[^a-zA-Z0-9ñÑ]/.test(clave)) puntos++;
  return puntos;
}

// Validates a DD/MM/AAAA date and returns an error message, or '' if OK.
export function validarFecha(texto: string): string {
  const m = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return 'Escribe la fecha completa: DD/MM/AAAA';
  const [dia, mes, anio] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const fecha = new Date(anio, mes - 1, dia);
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
    return 'Esa fecha no existe';
  }
  const edad = (Date.now() - fecha.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (edad < 10 || edad > 100) return 'Revisa el año de nacimiento';
  return '';
}

// "15/04/2002" -> "2002-04-15" (format the server stores).
export function fechaParaServidor(texto: string): string {
  const [dia, mes, anio] = texto.split('/');
  return `${anio}-${mes}-${dia}`;
}

// Formats digits as "DD/MM/AAAA" while the user types.
export function formatearFecha(texto: string): string {
  const d = texto.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}
