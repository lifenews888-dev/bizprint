import * as dotenv from 'dotenv'
dotenv.config({ override: true })

import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule)
  // Use Vendor entity directly
  const { Vendor } = await import('../vendors/vendor.entity')
  const repo: Repository<any> = app.get(getRepositoryToken(Vendor))

  const VENDORS = [
    { company_name: 'МГ Принт', contact_email: 'info@mgprint.mn', phone: '88150065', address: 'Хан-Уул дүүрэг, Ажилчны гудамж', district: 'ХУД', latitude: 47.8953, longitude: 106.8917, delivery_radius_km: 8, base_delivery_cost: 3000, cost_per_km: 500, vendor_type: 'mixed', services: ['banner', 'sticker', 'offset', 'uv_dtf'], tier: 'gold', score: 92, status: 'active', verified: true, rating: 4.8, logo_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=200' },
    { company_name: 'Соёмбо Принтинг', contact_email: 'info@soyombo.mn', phone: '70113550', address: 'Сүхбаатар дүүрэг, Их тойруу-54', district: 'СХД', latitude: 47.9057, longitude: 106.8325, delivery_radius_km: 6, base_delivery_cost: 2500, cost_per_km: 450, vendor_type: 'offset_print', services: ['offset', 'book', 'packaging'], tier: 'gold', score: 90, status: 'active', verified: true, rating: 4.7, logo_url: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=200' },
    { company_name: 'Шинэпресс ХХК', contact_email: 'info@newpress.mn', phone: '99112233', address: 'Баянгол дүүрэг', district: 'БГД', latitude: 47.9273, longitude: 106.9384, delivery_radius_km: 7, base_delivery_cost: 2000, cost_per_km: 400, vendor_type: 'digital_print', services: ['digital', 'offset', 'screen_print'], tier: 'silver', score: 85, status: 'active', verified: true, rating: 4.6, logo_url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=200' },
    { company_name: 'Адмон Принт', contact_email: 'info@admon.mn', phone: '99001122', address: 'Чингэлтэй дүүрэг', district: 'ЧД', latitude: 47.9138, longitude: 106.8832, delivery_radius_km: 5, base_delivery_cost: 3000, cost_per_km: 500, vendor_type: 'signage', services: ['signage', 'led', 'banner'], tier: 'silver', score: 80, status: 'active', verified: false, rating: 4.5, logo_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200' },
    { company_name: 'Интерпресс', contact_email: 'info@interpress.mn', phone: '77112616', address: 'Сүхбаатар дүүрэг, Жамъян Гүний-5', district: 'СХД', latitude: 47.9200, longitude: 106.9100, delivery_radius_km: 5, base_delivery_cost: 2500, cost_per_km: 450, vendor_type: 'mixed', services: ['offset', 'digital', 'packaging'], tier: 'bronze', score: 75, status: 'active', verified: false, rating: 4.4, logo_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=200' },
  ]

  for (const v of VENDORS) {
    const exists = await repo.findOne({ where: { company_name: v.company_name } })
    if (exists) { console.log(`SKIP: ${v.company_name}`); continue }
    await repo.save(repo.create(v))
    console.log(`OK: ${v.company_name}`)
  }

  await app.close()
  console.log('Vendor seed done!')
}
seed().catch(e => { console.error(e.message); process.exit(1) })
