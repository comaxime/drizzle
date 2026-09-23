import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as orm from 'drizzle-orm';
import { eq, sql } from 'drizzle-orm';
import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/pglite';
import { DrizzleModule, getDrizzleToken } from '../../lib/index.js';

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});
const photos = pgTable('photos', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  userId: integer('user_id').notNull(),
});

// Drizzle v1 declares relations with `defineRelations()` and filters
// relational queries with objects. v0.x declares them per table with
// `relations()`, passes them in `schema`, and filters with operators.
const isV1 = 'defineRelations' in orm;
const api = orm as any;

function drizzleOptions() {
  if (isV1) {
    const relations = api.defineRelations({ users, photos }, (r: any) => ({
      users: { photos: r.many.photos() },
      photos: {
        user: r.one.users({ from: r.photos.userId, to: r.users.id }),
      },
    }));
    return { relations };
  }
  const usersRelations = api.relations(users, ({ many }: any) => ({
    photos: many(photos),
  }));
  const photosRelations = api.relations(photos, ({ one }: any) => ({
    user: one(users, { fields: [photos.userId], references: [users.id] }),
  }));
  return { schema: { users, photos, usersRelations, photosRelations } };
}

describe(`Drizzle - relational queries (${isV1 ? 'v1' : 'v0.x'})`, () => {
  it('should pass the relations to drizzle() and load nested data', async () => {
    @Module({
      imports: [
        DrizzleModule.forRoot({
          drizzle,
          connection: 'memory://',
          ...drizzleOptions(),
        } as any),
      ],
    })
    class AppModule {}

    const app = await (
      await Test.createTestingModule({ imports: [AppModule] }).compile()
    ).init();
    const db: any = app.get(getDrizzleToken());

    await db.execute(
      sql`CREATE TABLE users (id serial PRIMARY KEY, name text NOT NULL)`,
    );
    await db.execute(
      sql`CREATE TABLE photos (id serial PRIMARY KEY, url text NOT NULL, user_id integer NOT NULL)`,
    );
    const [user] = await db.insert(users).values({ name: 'Kamil' }).returning();
    await db.insert(photos).values([
      { url: 'a.png', userId: user.id },
      { url: 'b.png', userId: user.id },
    ]);

    const found = await db.query.users.findFirst({
      where: isV1 ? { id: user.id } : eq(users.id, user.id),
      with: { photos: true },
    });
    expect(found).toMatchObject({
      name: 'Kamil',
      photos: [{ url: 'a.png' }, { url: 'b.png' }],
    });

    await app.close();
  });
});
