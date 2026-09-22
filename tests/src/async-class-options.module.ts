import { Module } from '@nestjs/common';
import { DrizzleModule } from '../../lib/index.js';
import { DrizzleConfigService } from './config.module.js';
import { PhotoModule } from './photo/photo.module.js';

@Module({
  imports: [
    DrizzleModule.forRootAsync({
      useClass: DrizzleConfigService,
    }),
    PhotoModule,
  ],
})
export class AsyncOptionsClassModule {}
