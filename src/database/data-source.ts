import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import { join } from 'path';
import { DataSource } from 'typeorm';

dotenvExpand.expand(dotenv.config());

// Database Credentials
const user = process.env.DATABASE_USER;
const password = process.env.DATABASE_PASSWORD;
const host = process.env.DATABASE_HOST;
const port = process.env.DATABASE_PORT;
const name = process.env.DATABASE_NAME;
const databaseUrl = `postgres://${user}:${password}@${host}:${port}/${name}`;

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [join(__dirname, '..', 'domain', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
});
