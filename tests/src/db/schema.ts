import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const photos = pgTable('photos', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  views: integer('views').notNull().default(0),
});
