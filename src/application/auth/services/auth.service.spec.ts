import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';

import { AuthService } from './auth.service';
import { USER_REPOSITORY } from '@domain/users/user.repository.interface';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '@application/auth/dto/login.dto';
import { UserRole } from '@domain/users/enums/role.enum';

describe('AuthService', () => {
  let service: AuthService;
  const fakeRepo = {
    findByEmail: jest.fn(),
  };
  const fakeJwt = {
    sign: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: USER_REPOSITORY, useValue: fakeRepo },
        { provide: JwtService, useValue: fakeJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== validateUser =====
  describe('validateUser()', () => {
    const email = 'user@test.com';
    const pass = 'PlainP@ss1';
    const userRecord = {
      userId: 'u1',
      email,
      password: '$argon2$...',
      role: UserRole.USER,
    };

    it('deve retornar o usuário se credenciais válidas', async () => {
      fakeRepo.findByEmail.mockResolvedValueOnce(userRecord);
      jest.spyOn(argon2, 'verify').mockResolvedValueOnce(true);

      const result = await service.validateUser(email, pass);
      expect(fakeRepo.findByEmail).toHaveBeenCalledWith(email);
      expect(argon2.verify).toHaveBeenCalledWith(userRecord.password, pass);
      expect(result).toBe(userRecord);
    });

    it('deve lançar UnauthorizedException se email não existir', async () => {
      fakeRepo.findByEmail.mockResolvedValueOnce(null);
      await expect(service.validateUser(email, pass)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException se senha inválida', async () => {
      fakeRepo.findByEmail.mockResolvedValueOnce(userRecord);
      jest.spyOn(argon2, 'verify').mockResolvedValueOnce(false);
      await expect(service.validateUser(email, pass)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  // ===== login =====
  describe('login()', () => {
    const dto: LoginDto = { email: 'user@test.com', password: 'PlainP@ss1' };
    const userRecord = {
      userId: 'u1',
      email: dto.email,
      password: '$argon2$...',
      role: UserRole.USER,
    };
    const signedToken = 'jwt.token.here';

    it('deve retornar um access_token válido com credenciais corretas', async () => {
      // forçamos o validateUser a retornar nosso objeto
      jest
        .spyOn(service, 'validateUser')
        .mockResolvedValueOnce(userRecord as any);
      fakeJwt.sign.mockReturnValueOnce(signedToken);

      const result = await service.login(dto);

      expect(service.validateUser).toHaveBeenCalledWith(
        dto.email,
        dto.password,
      );
      expect(fakeJwt.sign).toHaveBeenCalledWith({
        sub: userRecord.userId,
        email: userRecord.email,
        role: userRecord.role,
      });
      expect(result).toEqual({ access_token: signedToken });
    });

    it('deve repassar a UnauthorizedException se validateUser falhar', async () => {
      jest
        .spyOn(service, 'validateUser')
        .mockRejectedValueOnce(
          new UnauthorizedException('Invalid credentials'),
        );

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
