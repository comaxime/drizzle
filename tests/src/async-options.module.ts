import { Module } from '@nestjs/common';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { DrizzleModule } from '../../lib/index.js';
import { ConfigModule, DatabaseConfig } from './config.module.js';
import { PhotoModule } from './photo/photo.module.js';

@Module({
  imports: [
    DrizzleModule.forRootAsync({
      imports: [ConfigModule],
      inject: [DatabaseConfig],
      useFactory: async (config: DatabaseConfig) => {
        const client = await PGlite.create(config.dataDir);
        return { db: drizzle({ client }) };
      },
    }),
    PhotoModule,
  ],
})
export class AsyncOptionsFactoryModule {}
