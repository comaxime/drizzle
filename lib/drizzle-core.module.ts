import {
  DynamicModule,
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
  Provider,
  Type,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { closeDrizzleClient, getDrizzleToken } from './common/drizzle.utils.js';
import {
  DEFAULT_CONNECTION_NAME,
  DRIZZLE_MODULE_ID,
  DRIZZLE_MODULE_OPTIONS,
} from './drizzle.constants.js';
import type {
  DrizzleModuleAsyncOptions,
  DrizzleModuleOptions,
  DrizzleOptionsFactory,
} from './interfaces/index.js';

@Global()
@Module({})
export class DrizzleCoreModule implements OnApplicationShutdown {
  private readonly logger = new Logger('DrizzleModule');

  constructor(
    @Inject(DRIZZLE_MODULE_OPTIONS)
    private readonly options: DrizzleModuleOptions,
  ) {}

  static forRoot(options: DrizzleModuleOptions): DynamicModule {
    // Nest serializes a dynamic module's metadata to compute its key, so the
    // database instance (and its connection pool) must only be reachable
    // through a closure, never through a `useValue` provider.
    const optionsProvider: Provider = {
      provide: DRIZZLE_MODULE_OPTIONS,
      useFactory: () => options,
    };
    return this.createDynamicModule(options?.name, [optionsProvider]);
  }

  static forRootAsync(options: DrizzleModuleAsyncOptions): DynamicModule {
    return this.createDynamicModule(
      options.name,
      this.createAsyncProviders(options),
      options.imports,
    );
  }

  async onApplicationShutdown() {
    if (this.options.autoCloseConnection === false) {
      /* Skip closing the client automatically by shutdown hook */
      return;
    }
    try {
      await closeDrizzleClient(this.options.db);
    } catch (err) {
      this.logger.error(
        'Unable to close the database connection',
        (err as Error)?.stack,
      );
    }
  }

  private static createDynamicModule(
    name: string | undefined,
    optionsProviders: Provider[],
    imports: DynamicModule['imports'] = [],
  ): DynamicModule {
    const databaseProvider: Provider = {
      provide: getDrizzleToken(name),
      useFactory: (options: DrizzleModuleOptions) => {
        if (options?.db === undefined || options?.db === null) {
          const connection =
            name && name !== DEFAULT_CONNECTION_NAME ? ` ("${name}")` : '';
          throw new Error(
            `DrizzleModule${connection} was registered without a "db" option. Pass the database instance returned by Drizzle's drizzle() function.`,
          );
        }
        return options.db;
      },
      inject: [DRIZZLE_MODULE_OPTIONS],
    };

    return {
      module: DrizzleCoreModule,
      imports,
      providers: [
        ...optionsProviders,
        databaseProvider,
        {
          provide: DRIZZLE_MODULE_ID,
          useValue: randomUUID(),
        },
      ],
      exports: [databaseProvider],
    };
  }

  private static createAsyncProviders(
    options: DrizzleModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    if (!options.useClass) {
      throw new Error(
        'DrizzleModule.forRootAsync() requires one of "useFactory", "useClass" or "useExisting".',
      );
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: DrizzleModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: DRIZZLE_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    // `as Type<DrizzleOptionsFactory>` is a workaround for microsoft/TypeScript#31603
    const inject = [
      (options.useClass || options.useExisting) as Type<DrizzleOptionsFactory>,
    ];
    return {
      provide: DRIZZLE_MODULE_OPTIONS,
      useFactory: async (optionsFactory: DrizzleOptionsFactory) =>
        await optionsFactory.createDrizzleOptions(options.name),
      inject,
    };
  }
}
