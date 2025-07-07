import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'ID do usuário',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsString()
  targetId: string;

  @ApiPropertyOptional({ description: 'Novo e-mail' })
  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @ApiPropertyOptional({ description: 'Nova senha' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(10)
  @Matches(/.*[A-Z].*/, { message: 'Uma letra maiúscula' })
  @Matches(/.*[a-z].*/, { message: 'Uma letra minúscula' })
  @Matches(/.*\d.*/, { message: 'Um número' })
  @Matches(/.*\W.*/, { message: 'Um caracter especial' })
  password?: string;

  @ApiPropertyOptional({ description: 'Role (apenas Admin)', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
