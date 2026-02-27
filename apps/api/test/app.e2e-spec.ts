import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', async () => {
    const server = app.getHttpServer();
    const res = await new Promise<{ status: number; body: string }>((resolve) => {
      const http = require('http');
      const address = server.address();
      const port = typeof address === 'string' ? address : address?.port;
      http.get(`http://127.0.0.1:${port}/api/hello`, (response: any) => {
        let data = '';
        response.on('data', (chunk: string) => (data += chunk));
        response.on('end', () => resolve({ status: response.statusCode, body: data }));
      });
    });
    expect(res.status).toBe(200);
    expect(res.body).toBe('Hello World!');
  });
});
