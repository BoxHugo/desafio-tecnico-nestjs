import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail } from 'class-validator';
import { UserRole } from '../../../domain/users/enums/role.enum';

export class UserResponseDto {
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
  role: UserRole;

  constructor(userId: string, email: string, role: UserRole) {
    this.userId = userId;
    this.email = email;
    this.role = role;
  }
}
