import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel, PaginateOptions, PaginateResult } from 'mongoose';
import {
  IUserRepository,
  PaginationOptions as DomainPaginationOptions,
  PaginationResult as DomainPaginationResult,
} from '@domain/users/user.repository.interface';
import { User as DomainUser } from '@domain/users/user.entity';
import {
  UserRepo,
  UserDocument,
} from '@infrastructure/persistence/mongoose/users/schema/user.schema';
import { User } from '@domain/users/user.entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectModel(UserRepo.name)
    private readonly userRepository: PaginateModel<UserDocument>,
  ) {}

  create(user: User): Promise<UserDocument> {
    const created = new this.userRepository(user);
    return created.save();
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userRepository.findOne({ email }).exec();
  }

  findByUserId(userId: string): Promise<UserDocument | null> {
    return this.userRepository
      .findOne({ userId })
      .select('userId email password role')
      .exec();
  }

  async findAll(
    options: DomainPaginationOptions,
  ): Promise<DomainPaginationResult<DomainUser>> {
    const { page, limit } = options;
    const paginateOpts: PaginateOptions = {
      page,
      limit,
      lean: true,
      sort: { createdAt: -1 },
    };

    const result: PaginateResult<UserDocument> =
      await this.userRepository.paginate({}, paginateOpts);

    const items = result.docs.map(
      (doc) => new DomainUser(doc.userId, doc.email, doc.password, doc.role),
    );

    const totalPages = Math.ceil(result.totalDocs / result.limit);
    const hasNextPage = result.page! < totalPages;
    const hasPrevPage = result.page! > 1;

    return {
      items,
      total: result.totalDocs,
      page: result.page!,
      limit: result.limit,
      totalPages,
      hasNextPage,
      nextPage: hasNextPage ? result.page! + 1 : null,
      hasPrevPage,
      prevPage: hasPrevPage ? result.page! - 1 : null,
    };
  }

  async update(
    userId: string,
    attrs: Partial<DomainUser>,
  ): Promise<DomainUser> {
    const doc = await this.userRepository
      .findOneAndUpdate({ userId }, attrs, { new: true, runValidators: true })
      .exec();
    if (!doc) throw new NotFoundException(`User ${userId} not found`);
    return new DomainUser(doc.userId, doc.email, doc.password, doc.role);
  }

  async delete(userId: string): Promise<void> {
    const doc = await this.userRepository.findOneAndDelete({ userId }).exec();
    if (!doc) {
      throw new NotFoundException(`User ${userId} not found`);
    }
  }
}
