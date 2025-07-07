import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsEnum,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { UserRole } from '@domain/users/enums/role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Novo e-mail' })
  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @ApiPropertyOptional({ description: 'Nova senha' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(10)
  @Matches(/.*[A-Z].*/, { message: 'Deve conter ao menos 1 letra maiúscula' })
  @Matches(/.*[a-z].*/, { message: 'Deve conter ao menos 1 letra minúscula' })
  @Matches(/.*\d.*/, { message: 'Deve conter ao menos 1 número' })
  @Matches(/.*\W.*/, { message: 'Deve conter ao menos 1 caractere especial' })
  password?: string;

  @ApiPropertyOptional({
    description: 'Alterar perfil (apenas Admin)',
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role inválida' })
  role?: UserRole;
}
