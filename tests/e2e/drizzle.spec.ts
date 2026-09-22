import { INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'http';
import request from 'supertest';
import { ApplicationModule } from '../src/app.module.js';
import { AsyncOptionsClassModule } from '../src/async-class-options.module.js';
import { AsyncConnectionOptionsModule } from '../src/async-connection-options.module.js';
import { AsyncOptionsExistingModule } from '../src/async-existing-options.module.js';
import { AsyncOptionsFactoryModule } from '../src/async-options.module.js';
import { createDatabaseInstanceModule } from '../src/database-instance.module.js';

describe.each<[string, () => Type]>([
  ['forRoot (drizzle)', () => ApplicationModule],
  ['forRoot (db)', createDatabaseInstanceModule],
  ['forRootAsync (useFactory, drizzle)', () => AsyncConnectionOptionsModule],
  ['forRootAsync (useFactory)', () => AsyncOptionsFactoryModule],
  ['forRootAsync (useClass)', () => AsyncOptionsClassModule],
  ['forRootAsync (useExisting)', () => AsyncOptionsExistingModule],
])('Drizzle - %s', (_, getRootModule) => {
  let server: Server;
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [getRootModule()],
    }).compile();

    app = module.createNestApplication();
    server = app.getHttpServer();
    await app.init();
  });

  it('should return created row', async () => {
    await request(server).post('/photo').expect(201).expect({
      id: 1,
      name: 'Nest',
      description: 'Is great!',
      views: 6000,
    });
  });

  it('should query rows', async () => {
    await request(server).post('/photo').expect(201);

    await request(server)
      .get('/photo')
      .expect(200)
      .expect((res) => expect(res.body).toHaveLength(1));
    await request(server)
      .get('/photo/1')
      .expect(200)
      .expect((res) => expect(res.body.name).toBe('Nest'));
  });

  afterEach(async () => {
    await app.close();
  });
});
