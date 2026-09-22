import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

export function createDatabase() {
  return drizzle({ client: new PGlite() });
}

export type Database = ReturnType<typeof createDatabase>;
