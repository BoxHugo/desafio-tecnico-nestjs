import { User } from './user.entity';
import { UserDocument } from '@infrastructure/persistence/mongoose/users/schema/user.schema';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  nextPage: number | null;
  hasPrevPage: boolean;
  prevPage: number | null;
}

export interface IUserRepository {
  create(user: User): Promise<UserDocument>;
  findByUserId(userId: string): Promise<UserDocument | null>;
  findByEmail(email: string): Promise<UserDocument | null>;
  findAll(options: PaginationOptions): Promise<PaginationResult<User>>;
  update(userId: string, attrs: Partial<User>): Promise<User>;
  delete(userId: string): Promise<void>;
}
