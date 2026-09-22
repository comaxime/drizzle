import { Injectable, Module } from '@nestjs/common';
import {
  DrizzleModuleFactoryOptions,
  DrizzleOptionsFactory,
} from '../../lib/index.js';
import { createDatabase } from './db/database.js';

@Injectable()
export class DatabaseConfig {
  readonly dataDir = 'memory://';
}

@Injectable()
export class DrizzleConfigService implements DrizzleOptionsFactory {
  createDrizzleOptions(): DrizzleModuleFactoryOptions {
    return { db: createDatabase() };
  }
}

@Module({
  providers: [DatabaseConfig, DrizzleConfigService],
  exports: [DatabaseConfig, DrizzleConfigService],
})
export class ConfigModule {}
