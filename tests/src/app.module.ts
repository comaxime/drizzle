import { Module, Type } from '@nestjs/common';
import { DrizzleModule } from '../../lib/index.js';
import { createDatabase } from './db/database.js';
import { PhotoModule } from './photo/photo.module.js';

/**
 * `forRoot()` registers an instance created up front, so each application
 * gets its own module (and database) here.
 */
export function createApplicationModule(): Type {
  @Module({
    imports: [DrizzleModule.forRoot({ db: createDatabase() }), PhotoModule],
  })
  class ApplicationModule {}

  return ApplicationModule;
}
