import { DynamicModule, Module } from '@nestjs/common';
import { DrizzleCoreModule } from './drizzle-core.module.js';
import type {
  DrizzleModuleAsyncOptions,
  DrizzleModuleOptions,
} from './interfaces/drizzle-options.interface.js';

/**
 * @publicApi
 */
@Module({})
export class DrizzleModule {
  static forRoot(options: DrizzleModuleOptions): DynamicModule {
    return {
      module: DrizzleModule,
      imports: [DrizzleCoreModule.forRoot(options)],
    };
  }

  static forRootAsync(options: DrizzleModuleAsyncOptions): DynamicModule {
    return {
      module: DrizzleModule,
      imports: [DrizzleCoreModule.forRootAsync(options)],
    };
  }
}
