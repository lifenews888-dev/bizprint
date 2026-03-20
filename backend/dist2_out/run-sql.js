"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'bizprint',
});
async function run() {
    await AppDataSource.initialize();
    await AppDataSource.query(`
    ALTER TABLE machine
    ADD COLUMN IF NOT EXISTS machine_type VARCHAR DEFAULT 'digital';
  `);
    await AppDataSource.query(`
    ALTER TABLE machine
    ALTER COLUMN machine_type SET NOT NULL;
  `);
    console.log('✅ machine_type column added');
    process.exit(0);
}
run();
//# sourceMappingURL=run-sql.js.map