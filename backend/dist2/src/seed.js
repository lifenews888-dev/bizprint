"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const product_entity_1 = require("./products/product.entity");
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'bizprint',
    entities: [product_entity_1.Product],
    synchronize: false,
});
const products = [
    { name: 'Business Card', name_mn: 'Визитний карт', slug: 'business-card', category: 'offset', base_price: 150000, min_quantity: 100, lead_time_days: 3 },
    { name: 'Flyer A5', name_mn: 'Флаер A5', slug: 'flyer-a5', category: 'digital', base_price: 80000, min_quantity: 50, lead_time_days: 2 },
    { name: 'Flyer A4', name_mn: 'Флаер A4', slug: 'flyer-a4', category: 'digital', base_price: 120000, min_quantity: 50, lead_time_days: 2 },
    { name: 'Poster A3', name_mn: 'Постер A3', slug: 'poster-a3', category: 'digital', base_price: 15000, min_quantity: 1, lead_time_days: 1 },
    { name: 'Poster A2', name_mn: 'Постер A2', slug: 'poster-a2', category: 'digital', base_price: 25000, min_quantity: 1, lead_time_days: 1 },
    { name: 'Brochure Tri-fold', name_mn: 'Гурван нугалаас брошур', slug: 'brochure-trifold', category: 'offset', base_price: 200000, min_quantity: 100, lead_time_days: 4 },
    { name: 'Banner 100x200', name_mn: 'Баннер 100x200', slug: 'banner-100x200', category: 'wide_format', base_price: 45000, min_quantity: 1, lead_time_days: 2 },
    { name: 'Rollup Banner', name_mn: 'Роллап баннер', slug: 'rollup-banner', category: 'wide_format', base_price: 85000, min_quantity: 1, lead_time_days: 2 },
    { name: 'Sticker A4', name_mn: 'Стикер A4', slug: 'sticker-a4', category: 'digital', base_price: 12000, min_quantity: 10, lead_time_days: 1 },
    { name: 'Label Roll', name_mn: 'Шошго рулон', slug: 'label-roll', category: 'digital', base_price: 180000, min_quantity: 100, lead_time_days: 3 },
    { name: 'Envelope C5', name_mn: 'Дугтуй C5', slug: 'envelope-c5', category: 'offset', base_price: 90000, min_quantity: 100, lead_time_days: 3 },
    { name: 'Notepad A5', name_mn: 'Дэвтэр A5', slug: 'notepad-a5', category: 'offset', base_price: 75000, min_quantity: 50, lead_time_days: 4 },
    { name: 'Notepad A4', name_mn: 'Дэвтэр A4', slug: 'notepad-a4', category: 'offset', base_price: 120000, min_quantity: 50, lead_time_days: 4 },
    { name: 'Wall Calendar', name_mn: 'Хана календарь', slug: 'wall-calendar', category: 'offset', base_price: 350000, min_quantity: 50, lead_time_days: 7 },
    { name: 'Desk Calendar', name_mn: 'Ширээний календарь', slug: 'desk-calendar', category: 'offset', base_price: 280000, min_quantity: 50, lead_time_days: 7 },
    { name: 'Folder A4', name_mn: 'Хавтас A4', slug: 'folder-a4', category: 'offset', base_price: 250000, min_quantity: 100, lead_time_days: 5 },
    { name: 'Letterhead A4', name_mn: 'Албан бланк A4', slug: 'letterhead-a4', category: 'offset', base_price: 130000, min_quantity: 100, lead_time_days: 3 },
    { name: 'Certificate A4', name_mn: 'Гэрчилгээ A4', slug: 'certificate-a4', category: 'offset', base_price: 95000, min_quantity: 50, lead_time_days: 3 },
    { name: 'Invitation Card', name_mn: 'Урилга карт', slug: 'invitation-card', category: 'offset', base_price: 180000, min_quantity: 50, lead_time_days: 4 },
    { name: 'Magazine A4', name_mn: 'Сэтгүүл A4', slug: 'magazine-a4', category: 'book', base_price: 450000, min_quantity: 50, lead_time_days: 7 },
    { name: 'Catalog', name_mn: 'Каталог', slug: 'catalog', category: 'book', base_price: 380000, min_quantity: 50, lead_time_days: 7 },
    { name: 'Softcover Book', name_mn: 'Зөөлөн хавтастай ном', slug: 'softcover-book', category: 'book', base_price: 280000, min_quantity: 50, lead_time_days: 10 },
    { name: 'Packaging Box', name_mn: 'Савлах хайрцаг', slug: 'packaging-box', category: 'packaging', base_price: 320000, min_quantity: 50, lead_time_days: 7 },
    { name: 'Paper Bag', name_mn: 'Цаасан уут', slug: 'paper-bag', category: 'packaging', base_price: 220000, min_quantity: 100, lead_time_days: 5 },
    { name: 'Swing Tag', name_mn: 'Үнийн шошго', slug: 'swing-tag', category: 'offset', base_price: 85000, min_quantity: 100, lead_time_days: 3 },
    { name: 'Wall Graphic', name_mn: 'Ханын зураг', slug: 'wall-graphic', category: 'wide_format', base_price: 65000, min_quantity: 1, lead_time_days: 3 },
    { name: 'Vehicle Wrap', name_mn: 'Машины наалт', slug: 'vehicle-wrap', category: 'wide_format', base_price: 450000, min_quantity: 1, lead_time_days: 5 },
    { name: 'T-Shirt Print', name_mn: 'Цамцны хэвлэл', slug: 'tshirt-print', category: 'promo', base_price: 35000, min_quantity: 12, lead_time_days: 5 },
    { name: 'Mug Print', name_mn: 'Аягын хэвлэл', slug: 'mug-print', category: 'promo', base_price: 25000, min_quantity: 6, lead_time_days: 4 },
    { name: 'Canvas Print', name_mn: 'Канвас хэвлэл', slug: 'canvas-print', category: 'wide_format', base_price: 55000, min_quantity: 1, lead_time_days: 3 },
];
async function seed() {
    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(product_entity_1.Product);
    await repo.query('DELETE FROM products');
    for (const p of products) {
        const product = repo.create({ ...p, is_active: true, sort_order: products.indexOf(p) });
        await repo.save(product);
    }
    console.log('✅ 30 бүтээгдэхүүн амжилттай оруулагдлаа!');
    await AppDataSource.destroy();
}
seed().catch(console.error);
//# sourceMappingURL=seed.js.map