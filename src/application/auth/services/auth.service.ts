import {
  Injectable,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@domain/users/user.repository.interface';
import { LoginDto } from '@application/auth/dto/login.dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    this.logger.log('Verifica senha...');

    this.logger.log('Busca no banco de dados...');
    const user = await this.userRepo.findByEmail(email);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await argon2.verify(user.password, pass);

    if (!valid) throw new UnauthorizedException('Invalid credentials');

    this.logger.log('Credenciais ok');

    return user;
  }

  async login(dto: LoginDto) {
    this.logger.log(`Realizando login do usuário: ${dto.email}`);

    const user = await this.validateUser(dto.email, dto.password);

    const payload = { sub: user.userId, email: user.email, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }
}
