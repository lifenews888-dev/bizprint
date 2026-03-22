import { DataSource } from 'typeorm';

/**
 * TypeORM CLI data source — used for migration:generate, migration:run, etc.
 * Must match the config in app.module.ts TypeOrmModule.forRoot().
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'bizprint',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false, // CLI always false — use migrations
  logging: false,
});
