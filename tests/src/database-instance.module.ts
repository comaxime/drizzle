import { Module, Type } from '@nestjs/common';
import { DrizzleModule } from '../../lib/index.js';
import { createDatabase } from './db/database.js';
import { PhotoModule } from './photo/photo.module.js';

/**
 * A database instance passed to `forRoot()` is shared by every application
 * created from the importing module, so each application gets its own
 * module (and database) here.
 */
export function createDatabaseInstanceModule(): Type {
  @Module({
    imports: [DrizzleModule.forRoot({ db: createDatabase() }), PhotoModule],
  })
  class DatabaseInstanceModule {}

  return DatabaseInstanceModule;
}
