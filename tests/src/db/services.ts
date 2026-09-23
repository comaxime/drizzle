// The databases started by docker-compose.yml (and by the CI workflow).
export const POSTGRES_URL =
  process.env.POSTGRES_URL ?? 'postgres://root:root@localhost:15432/test';
export const MYSQL_URL =
  process.env.MYSQL_URL ?? 'mysql://root:root@localhost:13306/test';
