import { DynamicModule, Module } from '@nestjs/common';
import { DrizzleCoreModule } from './drizzle-core.module.js';
import type {
  DrizzleModuleAsyncOptions,
  DrizzleModuleOptions,
} from './interfaces/drizzle-options.interface.js';

/**
 * Registers a Drizzle database and makes it injectable across the application
 * with the `@InjectDrizzle()` decorator.
 *
 * @publicApi
 */
@Module({})
export class DrizzleModule {
  /**
   * Registers an existing database instance. Every application created from
   * the importing module shares that instance, and the first one to shut down
   * closes its client. If each application (e.g., in an e2e test suite) needs
   * a client of its own, use `forRootAsync()` instead.
   */
  static forRoot(options: DrizzleModuleOptions): DynamicModule {
    return {
      module: DrizzleModule,
      imports: [DrizzleCoreModule.forRoot(options)],
    };
  }

  /**
   * Registers a database created by a factory (`useFactory`) or by an options
   * factory class (`useClass`, `useExisting`). The factory runs once for each
   * application, so every application gets its own database client.
   */
  static forRootAsync(options: DrizzleModuleAsyncOptions): DynamicModule {
    return {
      module: DrizzleModule,
      imports: [DrizzleCoreModule.forRootAsync(options)],
    };
  }
}
