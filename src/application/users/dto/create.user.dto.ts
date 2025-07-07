import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../domain/users/enums/role.enum';

export class CreateUserInputDto {
  @ApiProperty({
    description: 'E-mail do usuário',
    example: 'teste@example.com',
  })
  @IsEmail({}, { message: 'Deve ser um e-mail válido' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description:
      'Senha de 6–10 caracteres com pelo menos uma letra minúscula, com pelo menos uma letra maiúscula, pelo menos um número e pelo menos um caractere especial',
    example: 'Aa1@xyz9',
  })
  @IsString({ message: 'A senha deve ser texto' })
  @MinLength(6, { message: 'A senha deve ter ao menos 6 caracteres' })
  @MaxLength(10, { message: 'A senha deve ter no máximo 10 caracteres' })
  @Matches(/.*[A-Z].*/, {
    message: 'A senha deve conter pelo menos 1 letra maiúscula',
  })
  @Matches(/.*[a-z].*/, {
    message: 'A senha deve conter pelo menos 1 letra minúscula',
  })
  @Matches(/.*\d.*/, {
    message: 'A senha deve conter pelo menos 1 número',
  })
  @Matches(/.*\W.*/, {
    message: 'A senha deve conter pelo menos 1 caractere especial',
  })
  password: string;
}

export class CreateUserOutputDto {
  @ApiProperty({
    description: 'ID gerado do usuário',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'E-mail do usuário',
    example: 'teste@example.com',
  })
  @IsEmail({}, { message: 'Deve ser um e-mail válido' })
  email: string;

  @ApiProperty({
    description: 'Perfil de acesso do usuário',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsString()
  role: string;

  constructor(userId: string, email: string, role: string) {
    this.userId = userId;
    this.email = email;
    this.role = role;
  }
}
