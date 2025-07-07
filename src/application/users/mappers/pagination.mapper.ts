// src/application/users/mappers/pagination.mapper.ts
import { PaginationResult } from '@domain/users/user.repository.interface';
import { User } from '@domain/users/user.entity';
import { UserResponseDto } from '@application/users/dto/user-response.dto';
import { PaginatedUserResponseDto } from '@application/users/dto/pagination-query.dto';
import { UserRole } from '@domain/users/enums/role.enum';

export function toPaginatedUserResponseDto(
  result: PaginationResult<User>,
): PaginatedUserResponseDto {
  const dto = new PaginatedUserResponseDto();

  dto.items = result.items.map(
    (user) =>
      new UserResponseDto(user.userId, user.email, user.role as UserRole),
  );

  // Metadados de paginação
  dto.total = result.total;
  dto.page = result.page;
  dto.limit = result.limit;
  dto.totalPages = result.totalPages;
  dto.hasNextPage = result.hasNextPage;
  dto.nextPage = result.nextPage;
  dto.hasPrevPage = result.hasPrevPage;
  dto.prevPage = result.prevPage;

  return dto;
}
