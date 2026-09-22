import { Logger, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { withReplicas } from 'drizzle-orm/pg-core';
import {
  DrizzleModule,
  DrizzleModuleOptions,
  getDrizzleToken,
} from '../../lib/index.js';
import { createDatabase } from '../src/db/database.js';

async function bootAndClose(...registrations: DrizzleModuleOptions[]) {
  @Module({
    imports: registrations.map((options) => DrizzleModule.forRoot(options)),
  })
  class AppModule {}

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = await moduleRef.init();
  await app.close();
}

describe('Drizzle - shutdown', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should close a real client on application shutdown', async () => {
    const db = createDatabase();
    await bootAndClose({ db });
    expect(db.$client.closed).toBe(true);
  });

  it('should call "end()" on pool-based clients', async () => {
    const end = vi.fn().mockResolvedValue(undefined);
    await bootAndClose({ db: { $client: { end } } });
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('should prefer "end()" over "close()"', async () => {
    const end = vi.fn();
    const close = vi.fn();
    await bootAndClose({ db: { $client: { end, close } } });
    expect(end).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
  });

  it('should call "close()" on embedded clients', async () => {
    const close = vi.fn();
    await bootAndClose({ db: { $client: { close } } });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('should support function clients (e.g. postgres.js)', async () => {
    const end = vi.fn();
    const client = Object.assign(() => undefined, { end });
    await bootAndClose({ db: { $client: client } });
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('should await "end()" of mysql2 callback clients through their promise wrapper', async () => {
    let closed = false;
    const promiseEnd = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      closed = true;
    });
    const callbackEnd = vi.fn();
    await bootAndClose({
      db: {
        $client: { end: callbackEnd, promise: () => ({ end: promiseEnd }) },
      },
    });
    expect(promiseEnd).toHaveBeenCalledTimes(1);
    expect(callbackEnd).not.toHaveBeenCalled();
    expect(closed).toBe(true);
  });

  it('should skip clients that hold nothing open', async () => {
    await expect(
      bootAndClose({ db: { $client: () => undefined } }),
    ).resolves.toBeUndefined();
    await expect(bootAndClose({ db: {} })).resolves.toBeUndefined();
  });

  it('should not close the client when "autoCloseConnection" is false', async () => {
    const end = vi.fn();
    await bootAndClose({
      db: { $client: { end } },
      autoCloseConnection: false,
    });
    expect(end).not.toHaveBeenCalled();
  });

  it('should log (not throw) when closing the client fails', async () => {
    const error = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const end = vi.fn().mockRejectedValue(new Error('already ended'));

    await expect(
      bootAndClose({ db: { $client: { end } } }),
    ).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith(
      'Unable to close the database connection',
      expect.stringContaining('already ended'),
    );
  });

  // `withReplicas()` exposes `$primary` and `$replicas` since Drizzle 0.44.6.
  it.skipIf(!('$replicas' in withReplicas({} as any, [{} as any])))(
    'should close the clients of the primary and replica databases',
    async () => {
      const primary = createDatabase();
      const firstReplica = createDatabase();
      const secondReplica = createDatabase();
      await bootAndClose({
        db: withReplicas(primary, [firstReplica, secondReplica]),
      });
      expect(primary.$client.closed).toBe(true);
      expect(firstReplica.$client.closed).toBe(true);
      expect(secondReplica.$client.closed).toBe(true);
    },
  );

  it('should close a client shared by several registrations once', async () => {
    const error = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const db = createDatabase();

    await bootAndClose({ db }, { name: 'analytics', db });
    expect(db.$client.closed).toBe(true);
    expect(error).not.toHaveBeenCalled();
  });

  it('should close the remaining clients when one of them fails', async () => {
    const error = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const end = vi.fn().mockRejectedValue(new Error('already ended'));
    const close = vi.fn();
    const primary = { $client: { end } };

    await bootAndClose({
      db: {
        ...primary,
        $primary: primary,
        $replicas: [{ $client: { close } }],
      },
    });
    expect(end).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
  });
});

describe('Drizzle - application lifecycle', () => {
  it('should create a new database for every application with forRootAsync()', async () => {
    @Module({
      imports: [
        DrizzleModule.forRootAsync({
          useFactory: () => ({ db: createDatabase() }),
        }),
      ],
    })
    class AppModule {}

    const boot = async () =>
      (
        await Test.createTestingModule({ imports: [AppModule] }).compile()
      ).init();

    const first = await boot();
    const firstDb = first.get(getDrizzleToken());
    await first.close();
    expect(firstDb.$client.closed).toBe(true);

    const second = await boot();
    const secondDb = second.get(getDrizzleToken());
    expect(secondDb).not.toBe(firstDb);
    expect(secondDb.$client.closed).toBe(false);
    await second.close();
  });
});
