import { Injectable, OnModuleInit } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { InjectDrizzle } from '../../../lib/index.js';
import type { Database } from '../db/database.js';
import { photos } from '../db/schema.js';

@Injectable()
export class PhotoService implements OnModuleInit {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async onModuleInit() {
    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS photos (
        id serial PRIMARY KEY,
        name text NOT NULL,
        description text NOT NULL,
        views integer NOT NULL DEFAULT 0
      )
    `);
  }

  async create() {
    const [photo] = await this.db
      .insert(photos)
      .values({ name: 'Nest', description: 'Is great!', views: 6000 })
      .returning();
    return photo;
  }

  findAll() {
    return this.db.select().from(photos);
  }

  async findOne(id: number) {
    const [photo] = await this.db
      .select()
      .from(photos)
      .where(eq(photos.id, id));
    return photo;
  }
}
