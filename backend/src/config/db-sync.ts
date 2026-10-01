/**
 * TypeORM-ийн schema synchronize асаах эсэх.
 *
 * `synchronize` нь entity бүрийг DB-тэй таарахаар автоматаар өөрчилдөг —
 * багана нэмэхэд тохиромжтой ч нэр солих, төрөл өөрчлөх, хасах үед
 * production дээрх өгөгдлийг анхааруулгагүйгээр устгана. Тиймээс production-д
 * унтраах ёстой бөгөөд схемийн өөрчлөлтийг `backend/migrations/*.sql`-ээр
 * хийнэ (тэднийг MigrationsRunnerService boot дээр ажиллуулна).
 *
 * Үүнийг NODE_ENV-ээс салгасан шалтгаан: NODE_ENV=production нь төлбөрийн
 * sandbox шалгалт (sandbox хаягтай бол процессыг зогсооно), CSP, лог дарах
 * зэргийг зэрэг асаадаг. Схемийн аюулыг хаахын тулд тэр бүгдийг нэг дор
 * хийх шаардлагагүй.
 *
 *   DB_SYNCHRONIZE=false → унтраана (production-д энэ)
 *   DB_SYNCHRONIZE=true  → асаана
 *   тохируулаагүй        → NODE_ENV-ээс хамаарна (өмнөх зан үйл хэвээр)
 */
export function shouldSynchronizeSchema(): boolean {
  const flag = process.env.DB_SYNCHRONIZE;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}
