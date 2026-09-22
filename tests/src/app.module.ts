import { Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/pglite';
import { DrizzleModule } from '../../lib/index.js';
import { PhotoModule } from './photo/photo.module.js';

@Module({
  imports: [
    DrizzleModule.forRoot({ drizzle, connection: 'memory://' }),
    PhotoModule,
  ],
})
export class ApplicationModule {}
