import { INestApplication, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as argon2 from 'argon2';
import mongoose from 'mongoose';

import { AppModule } from '../src/app.module';
import {
  UserDocument,
  UserRepo,
} from '../src/infrastructure/persistence/mongoose/users/schema/user.schema';
import { UserRole } from '../src/domain/users/enums/role.enum';

describe('Auth & Users (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let userModel: Model<UserDocument>;

  const ADMIN_ID = '12345678-abcd-z9x8-9999-a1b2c3d4e5f6';
  const ADMIN_EMAIL = 'admin@admin.com';
  const ADMIN_PWD = 'Admin@1';
  let adminToken: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();

    userModel = app.get<Model<UserDocument>>(getModelToken(UserRepo.name));

    await userModel.deleteMany({});

    const hash = await argon2.hash(ADMIN_PWD);
    await userModel.create({
      userId: ADMIN_ID,
      email: ADMIN_EMAIL,
      password: hash,
      role: UserRole.ADMIN,
    });

    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PWD })
      .expect(HttpStatus.CREATED);
    adminToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
    await mongoose.disconnect();
    await mongod.stop();
  });

  // --- LISTAGEM ---
  it('/v1/users (GET) - 200 e lista quando admin autenticado', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(HttpStatus.OK);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('/v1/users (GET) - 401 sem token', async () => {
    await request(app.getHttpServer())
      .get('/v1/users')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  // --- CREATE USER ---
  let newUserId: string;
  let newUserToken: string;

  it('/v1/users (POST) - 201 cria novo usuário', async () => {
    const dto = { email: 'user@x.com', password: 'Aa1@xyz9' };
    const res = await request(app.getHttpServer())
      .post('/v1/users')
      .send(dto)
      .expect(HttpStatus.CREATED);
    expect(res.body.userId).toBeDefined();
    expect(res.body.email).toBe(dto.email);
    expect(res.body.role).toBe(UserRole.USER);
    newUserId = res.body.userId;
  });

  it('/v1/auth/login (POST) - 201 faz login do usuário criado', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'user@x.com', password: 'Aa1@xyz9' })
      .expect(HttpStatus.CREATED);
    expect(res.body.access_token).toBeDefined();
    newUserToken = res.body.access_token;
  });

  // --- GET BY ID ---
  it('/v1/users/:id (GET) - 200 Recupera usuário', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/users/${newUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(HttpStatus.OK);
    expect(res.body.userId).toBe(newUserId);
    expect(res.body.email).toBe('user@x.com');
  });

  it('/v1/users/:id (GET) - 401 Recupera usuário sem token', async () => {
    await request(app.getHttpServer())
      .get(`/v1/users/${newUserId}`)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  // --- UPDATE ---
  it('/v1/users/:id (PATCH) - 200 Admin atualiza role do usuário', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/v1/users/${ADMIN_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ targetId: newUserId, role: UserRole.ADMIN })
      .expect(HttpStatus.OK);
    expect(res.body.role).toBe(UserRole.ADMIN);
  });

  it('/v1/users/:id (PATCH) - 401 Atualiza sem token', async () => {
    await request(app.getHttpServer())
      .patch(`/v1/users/${newUserId}`)
      .send({ targetId: newUserId, email: 'no@auth.com' })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  // --- DELETE ---
  it('/v1/users/:id (DELETE) - 204 Admin deleta usuário', async () => {
    await request(app.getHttpServer())
      .delete(`/v1/users/${ADMIN_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ targetId: newUserId })
      .expect(HttpStatus.NO_CONTENT);
  });

  it('/v1/users/:id (DELETE) - 401 Deleta sem token', async () => {
    await request(app.getHttpServer())
      .delete(`/v1/users/${newUserId}`)
      .send({ targetId: newUserId })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  // --- LOGOUT ---
  it('/v1/auth/logout (POST) - 200 Revoga o token', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(HttpStatus.OK, { message: 'Logout successful' });
  });
});
