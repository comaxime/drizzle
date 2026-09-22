import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/pglite';
import {
  DrizzleModule,
  DrizzleModuleOptions,
  getDrizzleToken,
} from '../../lib/index.js';
import type { Database } from '../src/db/database.js';

describe('Drizzle - drizzle() and connection options', () => {
  it('should create a database for every application and close it on shutdown', async () => {
    @Module({
      imports: [DrizzleModule.forRoot({ drizzle, connection: 'memory://' })],
    })
    class AppModule {}

    const boot = async () =>
      (
        await Test.createTestingModule({ imports: [AppModule] }).compile()
      ).init();

    const first = await boot();
    const firstDb = first.get<Database>(getDrizzleToken());
    const second = await boot();
    const secondDb = second.get<Database>(getDrizzleToken());
    expect(secondDb).not.toBe(firstDb);

    await first.close();
    expect(firstDb.$client.closed).toBe(true);
    expect(secondDb.$client.closed).toBe(false);
    await second.close();
    expect(secondDb.$client.closed).toBe(true);
  });

  it('should pass only the connection and Drizzle options to drizzle()', async () => {
    const db = { $client: { close: vi.fn() } };
    const drizzleFn = vi.fn(
      (_config: { connection: string; logger: boolean }) => db,
    );

    @Module({
      imports: [
        DrizzleModule.forRoot({
          name: 'analytics',
          autoCloseConnection: true,
          drizzle: drizzleFn,
          connection: 'postgres://localhost/analytics',
          logger: true,
        }),
      ],
    })
    class AppModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    expect(moduleRef.get(getDrizzleToken('analytics'))).toBe(db);
    expect(drizzleFn).toHaveBeenCalledTimes(1);
    expect(drizzleFn).toHaveBeenCalledWith({
      connection: 'postgres://localhost/analytics',
      logger: true,
    });

    await moduleRef.close();
    expect(db.$client.close).toHaveBeenCalledTimes(1);
  });

  it('should not close the client when "autoCloseConnection" is false', async () => {
    @Module({
      imports: [
        DrizzleModule.forRoot({
          drizzle,
          connection: 'memory://',
          autoCloseConnection: false,
        }),
      ],
    })
    class AppModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const db = moduleRef.get<Database>(getDrizzleToken());
    await moduleRef.close();
    expect(db.$client.closed).toBe(false);
    await db.$client.close();
  });

  it.each<[string, DrizzleModuleOptions, string]>([
    [
      'both "db" and "drizzle"',
      { db: {}, drizzle, connection: 'memory://' } as any,
      'DrizzleModule received both a "db" and a "drizzle" option.',
    ],
    [
      'a "drizzle" option that is not a function',
      { drizzle: 'drizzle-orm/pglite', connection: 'memory://' } as any,
      'DrizzleModule received a "drizzle" option that isn\'t a function.',
    ],
    [
      'neither "db" nor "drizzle"',
      { connection: 'memory://' } as any,
      'DrizzleModule was registered without a "db" or "drizzle" option.',
    ],
  ])(
    'should throw a descriptive error when given %s',
    async (_, options, message) => {
      @Module({ imports: [DrizzleModule.forRoot(options)] })
      class AppModule {}

      await expect(
        Test.createTestingModule({ imports: [AppModule] }).compile(),
      ).rejects.toThrow(message);
    },
  );
});
