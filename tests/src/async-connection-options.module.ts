import { Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/pglite';
import { DrizzleModule } from '../../lib/index.js';
import { ConfigModule, DatabaseConfig } from './config.module.js';
import { PhotoModule } from './photo/photo.module.js';

@Module({
  imports: [
    DrizzleModule.forRootAsync({
      imports: [ConfigModule],
      inject: [DatabaseConfig],
      useFactory: (config: DatabaseConfig) => ({
        drizzle,
        connection: config.dataDir,
      }),
    }),
    PhotoModule,
  ],
})
export class AsyncConnectionOptionsModule {}
