import * as dotenv from 'dotenv';
dotenv.config({ override: true });

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ExcelProductsService } from '../excel-products/excel-products.service';
import { join } from 'path';
import { readFileSync } from 'fs';

async function seed() {
  console.log('Starting Excel product seed...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const svc = app.get(ExcelProductsService);

  const filePath = join(process.cwd(), '..', 'Хэвлэлийн_үнэ.xlsx');
  console.log('Reading file:', filePath);

  const buffer = readFileSync(filePath);
  const result = await svc.importFromExcel(buffer);

  console.log('=== SEED RESULTS ===');
  console.log('Imported:', result.imported);
  console.log('Skipped:', result.skipped);
  console.log('Errors:', result.errors.length);
  if (result.errors.length > 0) {
    console.log('First 5 errors:');
    result.errors.slice(0, 5).forEach(e => console.log(`  ${e.sheet} row ${e.row}: ${e.message}`));
  }
  console.log('Preview:', result.preview.slice(0, 3));

  await app.close();
  console.log('Done!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
