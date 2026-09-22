import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
import {
  DrizzleModule,
  getDrizzleToken,
  InjectDrizzle,
} from '../../lib/index.js';
import { createDatabase, type Database } from '../src/db/database.js';

@Injectable()
class ReportsService {
  constructor(
    @InjectDrizzle() readonly db: Database,
    @InjectDrizzle('analytics') readonly analyticsDb: Database,
  ) {}
}

describe('Drizzle - multiple connections', () => {
  it('should register each database under its own token', async () => {
    @Module({
      imports: [
        DrizzleModule.forRoot({ db: createDatabase() }),
        DrizzleModule.forRootAsync({
          name: 'analytics',
          useFactory: () => ({ db: createDatabase() }),
        }),
      ],
      providers: [ReportsService],
    })
    class AppModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = await moduleRef.init();

    const { db, analyticsDb } = app.get(ReportsService);
    expect(db).toBe(app.get(getDrizzleToken()));
    expect(analyticsDb).toBe(app.get(getDrizzleToken('analytics')));
    expect(db).not.toBe(analyticsDb);

    await db.execute(sql`CREATE TABLE only_in_default (id int)`);
    await expect(
      analyticsDb.execute(sql`SELECT * FROM only_in_default`),
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        message: expect.stringMatching(/does not exist/),
      }),
    });

    await app.close();
  });

  it('should register the same database twice under different names', async () => {
    const shared = createDatabase();

    @Module({
      imports: [
        DrizzleModule.forRoot({ db: shared }),
        DrizzleModule.forRoot({ name: 'analytics', db: shared }),
      ],
    })
    class AppModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef.get(getDrizzleToken())).toBe(shared);
    expect(moduleRef.get(getDrizzleToken('analytics'))).toBe(shared);

    await moduleRef.close();
  });
});
