import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from '@interface/users/controller/user.controller';
import { UsersService } from '@application/users/services/user.service';
import {
  UserRepo,
  UserSchema,
} from '@infrastructure/persistence/mongoose/users/schema/user.schema';
import { UserRepository } from '@infrastructure/persistence/mongoose/users/repository/user.repository';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserRepo.name, schema: UserSchema }]),
    PersistenceModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
