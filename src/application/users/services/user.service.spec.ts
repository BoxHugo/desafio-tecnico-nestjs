import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as argon2 from 'argon2';

import { UsersService } from '@application/users/services/user.service';
import {
  USER_REPOSITORY,
  PaginationResult,
} from '@domain/users/user.repository.interface';
import { UserRole } from '@domain/users/enums/role.enum';
import { CreateUserInputDto } from '@application/users/dto/create.user.dto';

describe('UsersService', () => {
  let service: UsersService;
  const fakeRepo = {
    create: jest.fn(),
    findByUserId: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useValue: fakeRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  beforeEach(() => jest.clearAllMocks());

  // ===== CREATE =====
  describe('create()', () => {
    const dto: CreateUserInputDto = {
      email: 'foo@bar.com',
      password: 'Aa1@xyz9',
    };

    it('Cadastra usuário com sucesso', async () => {
      jest.spyOn(argon2, 'hash').mockResolvedValueOnce('HASHED');
      fakeRepo.create.mockResolvedValueOnce({
        userId: 'u1',
        email: dto.email,
        password: 'HASHED',
        role: UserRole.USER,
      });

      const result = await service.create(dto);

      expect(argon2.hash).toHaveBeenCalledWith(dto.password);
      expect(fakeRepo.create).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual({
        userId: 'u1',
        email: dto.email,
        role: UserRole.USER,
      });
    });

    it('Email não enviado - InternalServerErrorException', async () => {
      await expect(
        service.create({ password: 'Aa1@xyz9' } as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('Password não enviado - InternalServerErrorException', async () => {
      await expect(
        service.create({ email: 'foo@bar.com' } as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('Cadastra email já existente - ConflictException', async () => {
      jest.spyOn(argon2, 'hash').mockResolvedValueOnce('HASHED');
      fakeRepo.create.mockRejectedValueOnce({
        code: 11000,
        keyPattern: { email: 1 },
      });
      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  // ===== UPDATE =====
  describe('update()', () => {
    const owner = {
      userId: 'u1',
      email: 'u1@x',
      password: 'H',
      role: UserRole.USER,
    };
    const other = {
      userId: 'u2',
      email: 'u2@x',
      password: 'H',
      role: UserRole.USER,
    };

    it('Usuário não autenticado - NotFoundException', async () => {
      fakeRepo.findByUserId.mockResolvedValueOnce(null);
      await expect(
        service.update('u1', { targetId: 'u2' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('Usuário com role user atualiza outro usuário - ForbiddenException', async () => {
      fakeRepo.findByUserId
        .mockResolvedValueOnce(owner)
        .mockResolvedValueOnce(other);
      await expect(
        service.update('u1', { targetId: 'u2' } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('Usuário com role user atualiza a role para admin - ForbiddenException', async () => {
      fakeRepo.findByUserId
        .mockResolvedValueOnce(owner)
        .mockResolvedValueOnce(owner);
      await expect(
        service.update('u1', { targetId: 'u1', role: UserRole.ADMIN } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('Usuário com role user atualiza a sua senha - success', async () => {
      const originalPwd = 'Aa1@xy';
      jest.spyOn(argon2, 'hash').mockResolvedValueOnce('NEW_H');
      const dto = { targetId: 'u1', password: originalPwd } as any;
      const updatedOwner = { ...owner, password: 'NEW_H' };

      fakeRepo.findByUserId
        .mockResolvedValueOnce(owner)
        .mockResolvedValueOnce(owner);

      fakeRepo.update.mockResolvedValueOnce(updatedOwner);

      const res = await service.update('u1', dto);

      expect(argon2.hash).toHaveBeenCalledWith(originalPwd);

      expect(fakeRepo.update).toHaveBeenCalledWith('u1', {
        password: 'NEW_H',
      });

      expect(res.userId).toBe('u1');
    });

    it('Usuário com role admin atualiza role - success', async () => {
      const admin = { ...owner, userId: 'adm', role: UserRole.ADMIN };
      const dto = { targetId: 'u2', role: UserRole.ADMIN } as any;
      fakeRepo.findByUserId
        .mockResolvedValueOnce(admin)
        .mockResolvedValueOnce(other);
      fakeRepo.update.mockResolvedValueOnce({
        ...other,
        role: UserRole.ADMIN,
      });

      const res = await service.update('adm', dto);
      expect(fakeRepo.update).toHaveBeenCalledWith('u2', {
        role: UserRole.ADMIN,
      });
      expect(res.role).toBe(UserRole.ADMIN);
    });
  });

  // ===== GET BY ID =====
  describe('findByUserId()', () => {
    const id = 'u1';
    const rec = {
      userId: id,
      email: 'x@y',
      password: 'H',
      role: UserRole.USER,
    };

    it('Busca por um ID válido - returns record', async () => {
      fakeRepo.findByUserId.mockResolvedValueOnce(rec);
      const res = await service.findByUserId(id);
      expect(res.userId).toBe(id);
    });

    it('Busca por um ID inválido - NotFoundException', async () => {
      fakeRepo.findByUserId.mockResolvedValueOnce(null);
      await expect(service.findByUserId('bad')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  // ===== GET ALL =====
  describe('findAll()', () => {
    it('Retorna usuários', async () => {
      const pr: PaginationResult<any> = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        nextPage: null,
        hasPrevPage: false,
        prevPage: null,
      };
      fakeRepo.findAll.mockResolvedValueOnce(pr);

      const res = await service.findAll(1, 10);
      expect(fakeRepo.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(res).toEqual(pr);
    });
  });

  // ===== DELETE =====
  describe('remove()', () => {
    const owner = {
      userId: 'u1',
      email: 'u1@x',
      password: 'H',
      role: UserRole.USER,
    };
    const other = {
      userId: 'u2',
      email: 'u2@x',
      password: 'H',
      role: UserRole.USER,
    };

    it('Usuário com role user deleta outro usuário - ForbiddenException', async () => {
      fakeRepo.findByUserId
        .mockResolvedValueOnce(owner)
        .mockResolvedValueOnce(other);
      await expect(
        service.remove('u1', { targetId: 'u2' } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('Usuário com role user deleta a si - success', async () => {
      fakeRepo.findByUserId
        .mockResolvedValueOnce(owner)
        .mockResolvedValueOnce(owner);
      fakeRepo.delete.mockResolvedValueOnce(undefined);
      await expect(
        service.remove('u1', { targetId: 'u1' } as any),
      ).resolves.toBeUndefined();
    });

    it('Usuário com role admin deleta outro usuário - success', async () => {
      const admin = { ...owner, userId: 'adm', role: UserRole.ADMIN };
      fakeRepo.findByUserId
        .mockResolvedValueOnce(admin)
        .mockResolvedValueOnce(other);
      fakeRepo.delete.mockResolvedValueOnce(undefined);
      await expect(
        service.remove('adm', { targetId: 'u2' } as any),
      ).resolves.toBeUndefined();
    });

    it('Id não encontrado - NotFoundException', async () => {
      fakeRepo.findByUserId
        .mockResolvedValueOnce(owner)
        .mockResolvedValueOnce(null);
      await expect(
        service.remove('u1', { targetId: 'u2' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
