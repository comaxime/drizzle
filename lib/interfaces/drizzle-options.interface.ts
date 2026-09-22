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
   * (from any driver entry point, e.g., `drizzle-orm/node-postgres`).
   */
  db: TDatabase;
  /**
   * If `true`, the database's client (`db.$client`) is closed on application
   * shutdown, with its `end()` or `close()` method. For a database created
   * with `withReplicas()`, the replicas' clients are closed as well.
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
  /**
   * An existing provider, exported by one of the modules in `imports`, whose
   * `createDrizzleOptions()` method returns the options.
   */
  useExisting?: Type<DrizzleOptionsFactory<TDatabase>>;
  /**
   * A class that the module instantiates and whose `createDrizzleOptions()`
   * method returns the options.
   */
  useClass?: Type<DrizzleOptionsFactory<TDatabase>>;
  /**
   * A factory that returns the options. It runs once for each application, so
   * every application gets its own database client.
   */
  useFactory?: (
    ...args: any[]
  ) =>
    | Promise<DrizzleModuleFactoryOptions<TDatabase>>
    | DrizzleModuleFactoryOptions<TDatabase>;
  /**
   * The providers to inject into `useFactory`.
   */
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
}
