import { Module } from '@nestjs/common';
import { DrizzleModule } from '../../lib/index.js';
import { ConfigModule, DrizzleConfigService } from './config.module.js';
import { PhotoModule } from './photo/photo.module.js';

@Module({
  imports: [
    DrizzleModule.forRootAsync({
      imports: [ConfigModule],
      useExisting: DrizzleConfigService,
    }),
    PhotoModule,
  ],
})
export class AsyncOptionsExistingModule {}
