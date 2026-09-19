import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

describe('Auth Integration Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  it('should register a user, login, and validate the token', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      fullName: 'Test User',
    };

    // 1. Register
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(userData);

    expect(registerRes.status).toBe(201);
    expect(registerRes.body).toHaveProperty('id');
    expect(registerRes.body.email).toBe(userData.email);
    expect(registerRes.body).not.toHaveProperty('password');

    // 2. Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('access_token');
    expect(loginRes.body.user).toHaveProperty('id');

    const token = loginRes.body.access_token;

    // 3. Token Validation
    const jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'secretKey',
    });
    const decoded = jwtService.decode(token) as any;
    expect(decoded).toHaveProperty('sub');
    expect(decoded.sub).toBe(loginRes.body.user.id);
    expect(decoded).toHaveProperty('role');
    expect(decoded.role).toBe('USER');
  });

  it('should not register a user with an existing email', async () => {
    const userData = {
      email: 'duplicate@example.com',
      password: 'Password123!',
    };

    await request(app.getHttpServer()).post('/auth/register').send(userData);
    const res = await request(app.getHttpServer()).post('/auth/register').send(userData);

    expect(res.status).toBe(409);
  });

  it('should not login with invalid password', async () => {
    const userData = {
      email: 'invalid@example.com',
      password: 'CorrectPassword',
    };
    await request(app.getHttpServer()).post('/auth/register').send(userData);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: userData.email,
        password: 'WrongPassword',
      });

    expect(res.status).toBe(401);
  });

  it('should validate google user and return JWT', async () => {
    const googleProfile = {
      googleId: 'google-123',
      email: 'google-test@example.com',
      fullName: 'Google User',
    };

    // We can't easily mock the @AuthGuard('google') in a supertest call without a lot of boilerplate,
    // but we can test the service logic directly.
    const authService = app.get(require('../../src/auth/auth.service').AuthService);
    const result = await authService.validateGoogleUser(googleProfile);

    expect(result).toHaveProperty('access_token');
    expect(result.user).toHaveProperty('id');
    expect(result.user.email).toBe(googleProfile.email);
    expect(result.user.googleId).toBe(googleProfile.googleId);

    // Verify user exists in DB
    const user = await prisma.user.findUnique({
      where: { email: googleProfile.email },
    });
    expect(user).toBeDefined();
    expect(user?.googleId).toBe(googleProfile.googleId);
  });
});
