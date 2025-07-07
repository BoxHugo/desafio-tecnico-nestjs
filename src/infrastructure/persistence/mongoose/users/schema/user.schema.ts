import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '@domain/users/enums/role.enum';
import * as mongoosePaginate from 'mongoose-paginate-v2';

export type UserDocument = UserRepo & Document;

@Schema({ collection: 'users', timestamps: true })
export class UserRepo {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  userId: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({
    type: String,
    required: true,
    enum: [UserRole.ADMIN, UserRole.USER],
    default: UserRole.USER,
  })
  role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(UserRepo);

UserSchema.plugin(mongoosePaginate);
