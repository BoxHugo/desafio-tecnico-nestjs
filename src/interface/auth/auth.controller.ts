import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '@application/auth/services/auth.service';
import { LoginDto } from '@application/auth/dto/login.dto';
import { JwtAuthGuard } from '@interface/auth/jwt-auth.guard';
import { TokenBlacklistService } from '@infrastructure/cache/token-blacklist.service';
import { Public } from '@interface/common/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly blacklist: TokenBlacklistService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login e retorna JWT' })
  @ApiResponse({ status: 201, description: 'Token gerado' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout e revogação do token' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  logout(@Req() req: any) {
    const auth = req.headers.authorization as string;
    const token = auth.replace('Bearer ', '');
    this.blacklist.revoke(token);
    return { message: 'Logout successful' };
  }
}
