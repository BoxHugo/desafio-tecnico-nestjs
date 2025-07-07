import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'teste@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'Senha de 6–10 caracteres com pelo menos uma letra minúscula, com pelo menos uma letra maiúscula, pelo menos um número e pelo menos um caractere especial',
    example: 'Aa1@xyz9',
  })
  @IsNotEmpty()
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
