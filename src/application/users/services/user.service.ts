import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@domain/users/user.repository.interface';
import { CreateUserInputDto } from '@application/users/dto/create.user.dto';
import { LoginDto } from '@application/auth/dto/login.dto';
import * as argon2 from 'argon2';
import { UserRole } from '@domain/users/enums/role.enum';
import { User } from '@domain/users/user.entity';
import { v4 as uuidv4 } from 'uuid';
import {
  PaginationResult,
  PaginationOptions,
} from '@domain/users/user.repository.interface';
import { UserResponseDto } from '../dto/user-response.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  async create(dto: CreateUserInputDto): Promise<Record<string, string>> {
    let passwordHash;
    this.logger.log(`Criando usuário: ${dto.email}`);

    try {
      this.logger.log('Criando hash de senha...');
      passwordHash = await argon2.hash(dto.password);
    } catch (err: any) {
      const messageError = 'Falha ao gerar hash da senha';
      this.logger.error(messageError, err.stack, 'UsersService.create');
      throw new InternalServerErrorException(`${messageError}: ${err.stack}`);
    }

    const newUser = new User(uuidv4(), dto.email, passwordHash, UserRole.USER);

    try {
      this.logger.log('Adicionando usuário no banco de dados...');
      const user = await this.userRepo.create(newUser);

      return {
        userId: user.userId,
        email: user.email,
        role: user.role,
      };
    } catch (err: any) {
      if (err.code === 11000 && err.keyPattern?.email) {
        const messageError = 'E-mail já cadastrado';
        this.logger.error(messageError, err.stack, 'UsersService.create');
        throw new ConflictException(messageError);
      }
      const messageError = 'Não foi possível criar usuário';
      this.logger.error(messageError, err.stack, 'UsersService.create');
      throw new InternalServerErrorException(messageError);
    }
  }

  async findByEmail(dto: LoginDto): Promise<Record<string, string>> {
    let user;

    this.logger.log(`Buscando usuário por email: ${dto.email}`);

    try {
      user = await this.userRepo.findByEmail(dto.email);
    } catch (err: any) {
      const messageError = 'Não foi possível buscar usuário no banco por email';
      this.logger.error(messageError, err.stack, 'UsersService.findByEmail');
      throw new InternalServerErrorException(messageError);
    }

    if (!user) throw new NotFoundException('User not found');

    this.logger.log(`Usuário encontrado: ${user.userId}`);

    return {
      userId: user.userId,
      email: user.email,
      password: user.password,
      role: user.role,
    };
  }

  async findByUserId(id: string): Promise<Record<string, string>> {
    let user;

    this.logger.log(`Buscando usuário pelo id: ${id}`);

    try {
      user = await this.userRepo.findByUserId(id);
    } catch (err: any) {
      const messageError = 'Não foi possível buscar usuário no banco por ID';
      this.logger.error(messageError, err.stack, 'UsersService.findByUserId');
      throw new InternalServerErrorException(messageError);
    }

    if (!user) throw new NotFoundException('User not found');

    this.logger.log(`Usuário encontrado: ${user.userId}`);

    return {
      userId: user.userId,
      email: user.email,
      password: user.password,
      role: user.role,
    };
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginationResult<User>> {
    let result;
    this.logger.log(`Buscando todos usuários`);
    const options: PaginationOptions = { page, limit };

    try {
      result = await this.userRepo.findAll(options);
    } catch (err: any) {
      const messageError = 'Não foi possível recuperar usuarios';
      this.logger.error(messageError, err.stack, 'UsersService.findAll');
      throw new InternalServerErrorException(messageError);
    }
    return result;
  }

  async update(ownerId: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    this.logger.log(
      `Solicitante: ${ownerId} quer atualizar usuario ${dto.targetId}`,
    );

    this.logger.log('Recupera informações no banco...');
    const resultOwner = await this.userRepo.findByUserId(ownerId);
    const resultTarget = await this.userRepo.findByUserId(dto.targetId);

    if (!resultOwner) {
      this.logger.error('Usuário solicitante não encontrado');
      throw new NotFoundException('Usuário solicitante não encontrado');
    }

    if (!resultTarget) {
      this.logger.error('Usuário alvo não encontrado');
      throw new NotFoundException('Usuário alvo não encontrado');
    }

    this.logger.log('Valida role do usuário solicitante');
    if (resultOwner.role === UserRole.USER) {
      this.logger.log("Solicitante tem perfil 'user'");
      if (resultOwner.userId !== dto.targetId) {
        const msg =
          'Solicitante com perfil user, só pode atualizar seu próprio perfil';
        this.logger.error(msg);
        throw new ForbiddenException(msg);
      }

      if (dto.role && dto.role !== resultTarget.role) {
        const msg = 'Usuário não pode alterar sua própria role';
        throw new ForbiddenException(msg);
      }
    }

    if (dto.password) {
      const dtoPasswordHash = await argon2.hash(dto.password);

      if (dtoPasswordHash !== resultTarget.password) {
        this.logger.log('Atualizando a senha');
        dto.password = dtoPasswordHash;
      }
    }

    const allowed: Partial<User> = {
      ...(dto.password && { password: dto.password }),
      ...(resultOwner.role === UserRole.ADMIN &&
        dto.role && { role: dto.role }),
    };

    this.logger.log('Atualizando o registro na base...');

    try {
      const updated = await this.userRepo.update(dto.targetId, allowed);

      return new UserResponseDto(
        updated.userId,
        updated.email,
        updated.role as UserRole,
      );
    } catch (err: any) {
      const messageError = 'Não foi possível atualizar usuario na base';
      this.logger.error(messageError, err.stack, 'UsersService.update');
      throw new InternalServerErrorException(messageError);
    }
  }

  async remove(ownerId: string, dto: UpdateUserDto): Promise<void> {
    this.logger.log(`Usuário ${ownerId} solicitou remoção de ${dto.targetId}`);

    const resultOwner = await this.userRepo.findByUserId(ownerId);
    const resultTarget = await this.userRepo.findByUserId(dto.targetId);

    if (!resultOwner) throw new NotFoundException('Solicitante não encontrado');
    if (!resultTarget) throw new NotFoundException('Alvo não encontrado');

    if (
      resultOwner.role === UserRole.USER &&
      resultOwner.userId !== dto.targetId
    ) {
      throw new ForbiddenException('Você só pode remover seu próprio perfil');
    }

    await this.userRepo.delete(dto.targetId);
    this.logger.log(`Usuário ${dto.targetId} removido com sucesso`);
  }
}
