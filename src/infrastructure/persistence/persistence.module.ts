import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserRepository } from '@infrastructure/persistence/mongoose/users/repository/user.repository';
import { USER_REPOSITORY } from '@domain/users/user.repository.interface';
import {
  UserRepo,
  UserSchema,
} from '@infrastructure/persistence/mongoose/users/schema/user.schema';
import { TokenBlacklistService } from '@infrastructure/cache/token-blacklist.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserRepo.name, schema: UserSchema }]),
  ],
  providers: [
    { provide: USER_REPOSITORY, useClass: UserRepository },
    TokenBlacklistService,
  ],
  exports: [USER_REPOSITORY, TokenBlacklistService],
})
export class PersistenceModule {}
