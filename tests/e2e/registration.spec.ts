import {
  INestApplicationContext,
  Injectable,
  Module,
  Type,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import {
  DrizzleModule,
  DrizzleModuleFactoryOptions,
  DrizzleOptionsFactory,
  getDrizzleToken,
} from '../../lib/index.js';

describe('Drizzle - registration', () => {
  it('should derive tokens from the connection name', () => {
    expect(getDrizzleToken()).toBe('DrizzleDatabase');
    expect(getDrizzleToken('default')).toBe('DrizzleDatabase');
    expect(getDrizzleToken('analytics')).toBe('analyticsDrizzleDatabase');
  });

  // Nest serializes dynamic module metadata to compute module keys with the
  // "deep-hash" algorithm, and when a graph snapshot is enabled. A database
  // (with its pool and schema) must not end up in that metadata.
  it.each<[string, (module: Type) => Promise<INestApplicationContext>]>([
    [
      'default options',
      (module) => Test.createTestingModule({ imports: [module] }).compile(),
    ],
    [
      'moduleIdGeneratorAlgorithm: "deep-hash"',
      (module) =>
        Test.createTestingModule(
          { imports: [module] },
          { moduleIdGeneratorAlgorithm: 'deep-hash' },
        ).compile(),
    ],
    [
      'snapshot: true',
      (module) =>
        NestFactory.createApplicationContext(module, {
          snapshot: true,
          logger: false,
          abortOnError: false,
        }),
    ],
  ])(
    'should never serialize the database instance (%s)',
    async (_, createContext) => {
      const db = {
        toJSON() {
          throw new Error('The database instance was serialized');
        },
      };

      @Module({ imports: [DrizzleModule.forRoot({ db })] })
      class AppModule {}

      const context = await createContext(AppModule);
      expect(context.get(getDrizzleToken())).toBe(db);
    },
  );

  it('should pass the connection name to createDrizzleOptions()', async () => {
    const createDrizzleOptions = vi.fn((): DrizzleModuleFactoryOptions => ({
      db: {},
    }));

    @Injectable()
    class DrizzleConfigService implements DrizzleOptionsFactory {
      createDrizzleOptions = createDrizzleOptions;
    }

    @Module({
      imports: [
        DrizzleModule.forRootAsync({ useClass: DrizzleConfigService }),
        DrizzleModule.forRootAsync({
          name: 'analytics',
          useClass: DrizzleConfigService,
        }),
      ],
    })
    class AppModule {}

    await Test.createTestingModule({ imports: [AppModule] }).compile();
    expect(createDrizzleOptions.mock.calls).toEqual(
      expect.arrayContaining([[undefined], ['analytics']]),
    );
  });

  it('should throw a descriptive error when "db" is missing', async () => {
    @Module({
      imports: [
        DrizzleModule.forRootAsync({
          name: 'analytics',
          useFactory: () => ({ db: undefined }),
        }),
      ],
    })
    class AppModule {}

    await expect(
      Test.createTestingModule({ imports: [AppModule] }).compile(),
    ).rejects.toThrow(
      'DrizzleModule ("analytics") was registered without a "db" option',
    );
  });

  it('should throw a descriptive error when given a database instead of the options', async () => {
    const db = { $client: {} };

    @Module({
      imports: [
        DrizzleModule.forRootAsync({
          useFactory: () => db as unknown as DrizzleModuleFactoryOptions,
        }),
      ],
    })
    class AppModule {}

    await expect(
      Test.createTestingModule({ imports: [AppModule] }).compile(),
    ).rejects.toThrow(
      'DrizzleModule received a database instance instead of the module options. Pass it as the "db" option: { db }.',
    );
  });

  it('should throw when no async options strategy is provided', () => {
    expect(() => DrizzleModule.forRootAsync({})).toThrow(
      'DrizzleModule.forRootAsync() requires one of "useFactory", "useClass" or "useExisting".',
    );
  });
});
