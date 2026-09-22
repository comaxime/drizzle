import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DrizzleModule, getDrizzleToken } from '../../lib/index.js';

describe('Drizzle - registration', () => {
  it('should derive tokens from the connection name', () => {
    expect(getDrizzleToken()).toBe('DrizzleDatabase');
    expect(getDrizzleToken('default')).toBe('DrizzleDatabase');
    expect(getDrizzleToken('analytics')).toBe('analyticsDrizzleDatabase');
  });

  it('should never serialize the database instance', async () => {
    // Nest hashes dynamic module metadata to compute module keys. A database
    // (with its pool and schema) must not end up in that metadata.
    const db = {
      toJSON() {
        throw new Error('The database instance was serialized');
      },
    };

    @Module({ imports: [DrizzleModule.forRoot({ db })] })
    class AppModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    expect(moduleRef.get(getDrizzleToken())).toBe(db);
  });

  it('should throw a descriptive error when "db" is missing', async () => {
    @Module({
      imports: [
        DrizzleModule.forRootAsync({
          name: 'analytics',
          useFactory: () => ({ db: undefined }),
        }),
      ],
    })
    class AppModule {}

    await expect(
      Test.createTestingModule({ imports: [AppModule] }).compile(),
    ).rejects.toThrow(
      'DrizzleModule ("analytics") was registered without a "db" option',
    );
  });

  it('should throw when no async options strategy is provided', () => {
    expect(() => DrizzleModule.forRootAsync({})).toThrow(
      'DrizzleModule.forRootAsync() requires one of "useFactory", "useClass" or "useExisting".',
    );
  });
});
