import type {
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
  Type,
} from '@nestjs/common';

/**
 * @publicApi
 */
export interface DrizzleModuleOptions<TDatabase = any> {
  /**
   * Connection name. Required when registering more than one database.
   * Default: "default"
   */
  name?: string;
  /**
   * The database instance returned by Drizzle's `drizzle()` function
   * (from any driver entry point, e.g. `drizzle-orm/node-postgres`).
   */
  db: TDatabase;
  /**
   * If `true`, the database's underlying client (`db.$client`) is closed by the
   * `onApplicationShutdown` hook handler, using its `end()` or `close()` method.
   * Default: true
   */
  autoCloseConnection?: boolean;
}

/**
 * Options returned by `useFactory`, `useClass` and `useExisting`. The connection
 * name is set on the `forRootAsync()` options instead.
 *
 * @publicApi
 */
export type DrizzleModuleFactoryOptions<TDatabase = any> = Omit<
  DrizzleModuleOptions<TDatabase>,
  'name'
>;

/**
 * @publicApi
 */
export interface DrizzleOptionsFactory<TDatabase = any> {
  createDrizzleOptions(
    connectionName?: string,
  ):
    | Promise<DrizzleModuleFactoryOptions<TDatabase>>
    | DrizzleModuleFactoryOptions<TDatabase>;
}

/**
 * @publicApi
 */
export interface DrizzleModuleAsyncOptions<TDatabase = any> extends Pick<
  ModuleMetadata,
  'imports'
> {
  /**
   * Connection name. Required when registering more than one database.
   * Default: "default"
   */
  name?: string;
  useExisting?: Type<DrizzleOptionsFactory<TDatabase>>;
  useClass?: Type<DrizzleOptionsFactory<TDatabase>>;
  useFactory?: (
    ...args: any[]
  ) =>
    | Promise<DrizzleModuleFactoryOptions<TDatabase>>
    | DrizzleModuleFactoryOptions<TDatabase>;
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
}
