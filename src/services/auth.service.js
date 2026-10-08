import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { userRepository } from '../repositories/user.repository.js';
import { AuthResponse } from '../models/dto/response/auth.response.js';
import { UserResponse } from '../models/dto/response/user.response.js';

/** Compared when the user does not exist, so response time does not reveal valid emails. */
const DUMMY_HASH = bcrypt.hashSync('afrogo-dummy-password', 12);

export const authService = {
  /** @param {import('../models/dto/request/login.request.js').LoginRequest} request */
  async login(request) {
    const user = await userRepository.findByEmail(request.email);
    const matches = await bcrypt.compare(request.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !user.isActive || !matches) {
      throw new AppError(401, 'Correo o contraseña incorrectos');
    }

    await userRepository.touchLogin(user.id);
    const token = jwt.sign({ sub: user.id }, env.jwt.secret, {
      algorithm: 'HS256',
      expiresIn: env.jwt.expiresIn,
    });
    return AuthResponse.from(token, jwt.decode(token).exp, user);
  },

  /** @param {import('../models/entities/user.entity.js').User} user */
  me(user) {
    return UserResponse.fromEntity(user);
  },
};
