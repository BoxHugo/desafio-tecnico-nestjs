// scripts/seed.ts
import 'dotenv/config';
import mongoose from 'mongoose';
import * as argon2 from 'argon2';
import { UserSchema } from '@infrastructure/persistence/mongoose/users/schema/user.schema';
import { UserRole } from '@domain/users/enums/role.enum';

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI não está definido');
    process.exit(1);
  }
  await mongoose.connect(uri);

  // Registra aqui o model usando o schema que você já tem
  const UserModel = mongoose.model('User', UserSchema);

  const email = process.env.ADMIN_EMAIL!;
  const id = process.env.ADMIN_ID!;
  const pwd = process.env.ADMIN_PWD!;

  console.log(`email: ${process.env.ADMIN_EMAIL}`);

  const exists = await UserModel.findOne({ email }).exec();
  if (exists) {
    console.log('Usuário admin já existe');
    process.exit(0);
  }

  const hash = await argon2.hash(pwd);
  await UserModel.create({
    userId: id,
    email,
    password: hash,
    role: UserRole.ADMIN,
  });

  console.log('Admin seed criado com sucesso');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
