import {
  Controller,
  Get,
  Post,
  Query,
  Patch,
  Req,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '@application/users/services/user.service';
import {
  CreateUserInputDto,
  CreateUserOutputDto,
} from '@application/users/dto/create.user.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@interface/auth/jwt-auth.guard';
import {
  PaginationQueryDto,
  PaginatedUserResponseDto,
} from '@application/users/dto/pagination-query.dto';
import { toPaginatedUserResponseDto } from '@application/users/mappers/pagination.mapper';
import { UserRole } from '@domain/users/enums/role.enum';
import { Roles } from '@interface/common/roles.decorator';
import { UpdateUserDto } from '@application/users/dto/update-user.dto';
import { Public } from '@interface/common/public.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria um novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado',
    type: CreateUserOutputDto,
  })
  async create(@Body() dto: CreateUserInputDto): Promise<CreateUserOutputDto> {
    const user = await this.usersService.create(dto);

    return new CreateUserOutputDto(user.userId, user.email, user.role);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Busca usuário por ID' })
  @ApiResponse({
    status: 201,
    description: 'Usuário encontrado',
    type: CreateUserOutputDto,
  })
  @Get(':id')
  async findById(@Param('id') id: string): Promise<CreateUserOutputDto> {
    const user = await this.usersService.findByUserId(id);

    return new CreateUserOutputDto(user.userId, user.email, user.role);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Busca todos os usuários' })
  @ApiResponse({
    status: 201,
    description: 'Usuários encontrados',
    type: PaginatedUserResponseDto,
  })
  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedUserResponseDto> {
    '';
    const result = await this.usersService.findAll(query.page, query.limit);
    return toPaginatedUserResponseDto(result);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualiza usuário por ID' })
  @ApiResponse({
    status: 201,
    description: 'Usuário atualizado',
    type: UpdateUserDto,
  })
  @Roles(UserRole.USER, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: any) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deleta usuário por ID' })
  @ApiResponse({
    status: 201,
    description: 'Usuário deletado',
  })
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: any,
  ): Promise<void> {
    await this.usersService.remove(id, dto);
  }
}
