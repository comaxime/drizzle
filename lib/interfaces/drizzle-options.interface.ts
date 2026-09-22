import type {
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
  Type,
} from '@nestjs/common';

/**
 * A driver's `drizzle()` function, e.g., the one exported by
 * `drizzle-orm/node-postgres`.
 *
 * @publicApi
 */
export type DrizzleFunction = (...params: any[]) => unknown;

/**
 * The object form of a driver's `drizzle()` config that takes a `connection`
 * (a connection string or the driver's connection options), along with
 * Drizzle options such as `relations`, `logger`, or `casing`.
 *
 * @publicApi
 */
export type DrizzleConnectionConfig<TDrizzle> = TDrizzle extends (
  ...params: infer TParams
) => unknown
  ? 0 extends 1 & TParams[0]
    ? { connection?: unknown; [option: string]: unknown }
    : ConnectionForm<TParams[0]>
  : never;

// Keeps the members of a union that declare a `connection` option, i.e., the
// object form of the config (not a connection string or a client instance).
type ConnectionForm<TParam> = TParam extends unknown
  ? 'connection' extends keyof TParam
    ? TParam
    : never
  : never;

/**
 * @publicApi
 */
export interface DrizzleModuleSharedOptions {
  /**
   * Connection name. Required when registering more than one database.
   * Default: "default"
   */
  name?: string;
  /**
   * If `true`, the database's client (`db.$client`) is closed on application
   * shutdown, with its `end()` or `close()` method. For a database created
   * with `withReplicas()`, the replicas' clients are closed as well (with
   * Drizzle 0.44.6 and later, which exposes them as `$replicas`).
   * Default: true
   */
  autoCloseConnection?: boolean;
}

/**
 * Registers a database instance that you create yourself.
 *
 * @publicApi
 */
export interface DrizzleDatabaseOptions<TDatabase = any> {
  /**
   * The database instance returned by Drizzle's `drizzle()` function
   * (from any driver entry point, e.g., `drizzle-orm/node-postgres`).
   */
  db: TDatabase;
  drizzle?: never;
  connection?: never;
}

/**
 * Lets the module create the database, by calling the given `drizzle()`
 * function with the rest of the options once for each application.
 *
 * @publicApi
 */
export type DrizzleConnectionOptions<TDrizzle = DrizzleFunction> = {
  /**
   * The `drizzle()` function of your driver, e.g., the one exported by
   * `drizzle-orm/node-postgres`. The module calls it with `connection` and
   * the other Drizzle options.
   */
  drizzle: TDrizzle;
  db?: never;
  // Infers `TDrizzle` from the `drizzle` option only (like `NoInfer`).
} & DrizzleConnectionConfig<[TDrizzle][TDrizzle extends any ? 0 : never]>;

/**
 * @publicApi
 */
export type DrizzleModuleOptions<
  TDatabase = any,
  TDrizzle = DrizzleFunction,
> = DrizzleModuleSharedOptions &
  (DrizzleDatabaseOptions<TDatabase> | DrizzleConnectionOptions<TDrizzle>);

/**
 * Options returned by `useFactory`, `useClass` and `useExisting`. The connection
 * name is set on the `forRootAsync()` options instead.
 *
 * @publicApi
 */
export type DrizzleModuleFactoryOptions<
  TDatabase = any,
  TDrizzle = DrizzleFunction,
> = Omit<DrizzleModuleSharedOptions, 'name'> &
  (DrizzleDatabaseOptions<TDatabase> | DrizzleConnectionOptions<TDrizzle>);

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
export interface DrizzleModuleAsyncOptions<
  TDatabase = any,
  TDrizzle = DrizzleFunction,
> extends Pick<ModuleMetadata, 'imports'> {
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
    | Promise<DrizzleModuleFactoryOptions<TDatabase, TDrizzle>>
    | DrizzleModuleFactoryOptions<TDatabase, TDrizzle>;
  /**
   * The providers to inject into `useFactory`.
   */
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
}
