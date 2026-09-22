import { DEFAULT_CONNECTION_NAME } from '../drizzle.constants.js';

/**
 * Returns the injection token of the Drizzle database registered under the
 * given connection name.
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

type DrizzleClient = {
  end?: () => unknown;
  close?: () => unknown;
  promise?: () => DrizzleClient;
};
type DrizzleDatabaseLike = {
  $client?: unknown;
  $primary?: DrizzleDatabaseLike;
  $replicas?: DrizzleDatabaseLike[];
};

const closedClients = new WeakSet<object>();

/**
 * Returns the driver clients a Drizzle database holds: `db.$client` and, for a
 * database created with `withReplicas()`, the clients of its primary and
 * replica databases.
 */
export function getDrizzleClients(db: unknown): DrizzleClient[] {
  const database = db as DrizzleDatabaseLike | null | undefined;
  const databases = [
    database,
    database?.$primary,
    ...(Array.isArray(database?.$replicas) ? database.$replicas : []),
  ];
  const clients = new Set<DrizzleClient>();
  for (const candidate of databases) {
    const client = candidate?.$client;
    if (
      client &&
      (typeof client === 'object' || typeof client === 'function')
    ) {
      clients.add(client as DrizzleClient);
    }
  }
  return [...clients];
}

/**
 * Closes a driver client, unless it's already been closed (e.g., because the
 * same database is registered under several connection names). Pool-based
 * drivers (node-postgres, postgres.js, mysql2, Neon WebSocket) expose `end()`,
 * embedded ones (better-sqlite3, libSQL, PGlite, Bun SQL) expose `close()`,
 * and HTTP drivers (Neon HTTP, D1, PlanetScale) hold nothing open.
 */
export async function closeDrizzleClient(client: DrizzleClient): Promise<void> {
  if (closedClients.has(client)) {
    return;
  }
  closedClients.add(client);
  // mysql2 callback clients (detected the way Drizzle detects them) end in the
  // background. Their promise wrapper resolves once they're closed.
  const target =
    typeof client.promise === 'function' ? client.promise() : client;
  if (typeof target.end === 'function') {
    await target.end();
  } else if (typeof target.close === 'function') {
    await target.close();
  }
}
