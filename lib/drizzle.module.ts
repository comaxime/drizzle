import { DynamicModule, Module } from '@nestjs/common';
import { DrizzleCoreModule } from './drizzle-core.module.js';
import type {
  DrizzleFunction,
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
   * Registers a database from static options.
   *
   * With `drizzle` and `connection`, the module creates the database by
   * calling the given `drizzle()` function once for each application, so
   * every application gets its own client.
   *
   * With `db`, it registers an instance that you created. Every application
   * created from the importing module shares that instance, and the first one
   * to shut down closes its client.
   */
  static forRoot<TDrizzle = DrizzleFunction>(
    options: DrizzleModuleOptions<any, TDrizzle>,
  ): DynamicModule {
    return {
      module: DrizzleModule,
      imports: [DrizzleCoreModule.forRoot(options)],
    };
  }

  /**
   * Registers a database whose options are created by a factory
   * (`useFactory`) or by an options factory class (`useClass`,
   * `useExisting`). The factory runs once for each application.
   */
  static forRootAsync<TDrizzle = DrizzleFunction>(
    options: DrizzleModuleAsyncOptions<any, TDrizzle>,
  ): DynamicModule {
    return {
      module: DrizzleModule,
      imports: [DrizzleCoreModule.forRootAsync(options)],
    };
  }
}
