import { DEFAULT_CONNECTION_NAME } from '../drizzle.constants.js';

/**
 * This function returns the injection token of the Drizzle database registered
 * under the given connection name.
 * @param {string} [name='default'] Connection name
 * @returns {string} The database injection token
 *
 * @publicApi
 */
export function getDrizzleToken(
  name: string = DEFAULT_CONNECTION_NAME,
): string {
  return name === DEFAULT_CONNECTION_NAME
    ? 'DrizzleDatabase'
    : `${name}DrizzleDatabase`;
}

/**
 * Closes the client a Drizzle database was created with (`db.$client`).
 * Pool-based drivers (node-postgres, postgres.js, mysql2, Neon WebSocket) expose
 * `end()`, embedded ones (better-sqlite3, libSQL, PGlite, Bun SQL) expose `close()`,
 * and HTTP drivers (Neon HTTP, D1, PlanetScale) hold nothing open.
 */
export async function closeDrizzleClient(db: unknown): Promise<void> {
  const client = (db as { $client?: unknown } | null | undefined)?.$client as
    { end?: () => unknown; close?: () => unknown } | undefined;
  if (!client || (typeof client !== 'object' && typeof client !== 'function')) {
    return;
  }
  if (typeof client.end === 'function') {
    await client.end();
  } else if (typeof client.close === 'function') {
    await client.close();
  }
}
