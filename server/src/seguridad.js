import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const LARGO_HASH = 64;

// Returns { hash, sal } to store. The password itself is never saved.
export async function crearHash(contrasena) {
  const sal = randomBytes(16).toString('hex');
  const hash = await scryptAsync(contrasena, sal, LARGO_HASH);
  return { hash: hash.toString('hex'), sal };
}

// Compares in constant time so the response time does not leak information.
export async function verificarContrasena(contrasena, hashGuardado, sal) {
  const hash = await scryptAsync(contrasena, sal, LARGO_HASH);
  const guardado = Buffer.from(hashGuardado, 'hex');
  return guardado.length === hash.length && timingSafeEqual(guardado, hash);
}

// Random session token (256 bits).
export function nuevoToken() {
  return randomBytes(32).toString('hex');
}
