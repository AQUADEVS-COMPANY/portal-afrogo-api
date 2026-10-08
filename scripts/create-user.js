/**
 * Creates a panel user.
 * Usage: npm run create-user -- <email> "<Full name>" <password> [administrator|secretary]
 */
import bcrypt from 'bcryptjs';
import { closePool } from '../src/config/database.js';
import { userRepository } from '../src/repositories/user.repository.js';
import { mapSpError } from '../src/constants/error-codes.js';
import { ROLES } from '../src/constants/roles.js';

const [email, fullName, password, roleCode = ROLES.SECRETARY] = process.argv.slice(2);

async function main() {
  if (!email || !fullName || !password) {
    console.error('Uso: npm run create-user -- <correo> "<Nombre completo>" <contraseña> [administrator|secretary]');
    process.exitCode = 1;
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('El correo no es válido');
  if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');

  const passwordHash = await bcrypt.hash(password, 12);
  await userRepository.create({ fullName, email, passwordHash, roleCode });
  console.log(`Usuario creado: ${email.toLowerCase()} (${roleCode})`);
}

try {
  await main();
} catch (err) {
  console.error(`Error: ${mapSpError(err)?.message ?? err.message}`);
  process.exitCode = 1;
} finally {
  await closePool();
}
