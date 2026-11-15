// Real "Continuar con Google". Configured in server/.env:
//   GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com   (OAuth client of type "Web application")
// The app shows Google's official button, Google gives it an ID token (a signed JWT),
// and here we ask Google to check it before trusting the e-mail inside.

export const googleConfigurado = () => Boolean(process.env.GOOGLE_CLIENT_ID);

async function verificarConGoogle(credencial) {
  const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credencial)}`);
  if (!r.ok) return null;
  return r.json();
}

let verificador = verificarConGoogle;
// Tests replace the call to Google with a fake one.
export function usarVerificadorGoogle(fn) {
  verificador = fn ?? verificarConGoogle;
}

// Returns { sub, correo, nombre } if the token is valid and made for FitFat, or null.
export async function verificarTokenGoogle(credencial) {
  if (!credencial || typeof credencial !== 'string') return null;
  const d = await verificador(credencial).catch(() => null);
  if (!d) return null;
  const valido =
    d.aud === process.env.GOOGLE_CLIENT_ID &&
    ['accounts.google.com', 'https://accounts.google.com'].includes(d.iss) &&
    Number(d.exp) * 1000 > Date.now() &&
    (d.email_verified === true || d.email_verified === 'true');
  if (!valido) return null;
  return { sub: String(d.sub), correo: String(d.email).toLowerCase(), nombre: d.name ?? d.given_name ?? null };
}
