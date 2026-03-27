-- Seed 20 business card layouts matching BC_TEMPLATES from frontend/lib/bc-templates.ts
-- Usage: cat seed-bc-20.sql | docker exec -i bizprint_postgres psql -U postgres -d bizprint
DO $$
DECLARE pid uuid := '57229fb9-12d5-4104-863f-d95e619f30d8';
BEGIN

-- Remove existing layouts for this product
DELETE FROM bc_layouts WHERE product_id = pid;

INSERT INTO bc_layouts (id, product_id, name, name_mn, type, front_json, back_json, sort_order, is_active) VALUES
-- 1. Classic Blue (corporate)
(gen_random_uuid(), pid, 'Классик цэнхэр', 'Классик цэнхэр', 'business',
 '{"name":{"x":25,"y":40,"size":20,"bold":true,"color":"text"},"title":{"x":25,"y":62,"size":11},"phone":{"x":50,"y":110,"size":11},"email":{"x":50,"y":132,"size":11},"address":{"x":50,"y":154,"size":10},"website":{"x":50,"y":176,"size":10},"logo":{"x":280,"y":30,"w":50,"h":50},"company":{"x":280,"y":95,"size":14,"bold":true}}',
 '{"logo":{"x":195,"y":50,"w":60,"h":60},"company":{"x":225,"y":130,"size":16,"bold":true,"color":"text"},"slogan":{"x":225,"y":152,"size":11}}',
 0, true),

-- 2. Teal Modern (corporate)
(gen_random_uuid(), pid, 'Орчин үеийн ногоон', 'Орчин үеийн ногоон', 'business',
 '{"name":{"x":30,"y":160,"size":18,"bold":true,"color":"text"},"title":{"x":30,"y":182,"size":11},"phone":{"x":55,"y":210,"size":10},"email":{"x":200,"y":210,"size":10},"address":{"x":55,"y":230,"size":9},"website":{"x":200,"y":230,"size":9},"logo":{"x":195,"y":30,"w":60,"h":50},"company":{"x":225,"y":100,"size":15,"bold":true},"qr":{"x":350,"y":155,"w":70}}',
 '{"logo":{"x":190,"y":60,"w":70,"h":60},"company":{"x":225,"y":145,"size":18,"bold":true,"color":"text"},"slogan":{"x":225,"y":170,"size":12}}',
 1, true),

-- 3. Navy Gold (bold)
(gen_random_uuid(), pid, 'Хар хөх алтан', 'Хар хөх алтан', 'full',
 '{"name":{"x":25,"y":80,"size":20,"bold":true,"color":"text"},"title":{"x":25,"y":104,"size":11},"phone":{"x":50,"y":140,"size":11},"email":{"x":50,"y":162,"size":11},"address":{"x":50,"y":184,"size":10},"website":{"x":50,"y":206,"size":10},"logo":{"x":320,"y":70,"w":55,"h":55},"company":{"x":320,"y":140,"size":13,"bold":true}}',
 '{"logo":{"x":195,"y":60,"w":60,"h":60},"company":{"x":225,"y":145,"size":16,"bold":true,"color":"accent"},"slogan":{"x":225,"y":170,"size":11}}',
 2, true),

-- 4. Dark Orange (dark)
(gen_random_uuid(), pid, 'Хар улбар шар', 'Хар улбар шар', 'full',
 '{"name":{"x":25,"y":100,"size":20,"bold":true,"color":"accent"},"title":{"x":25,"y":124,"size":11},"phone":{"x":25,"y":170,"size":11},"email":{"x":25,"y":192,"size":11},"address":{"x":25,"y":214,"size":10},"website":{"x":25,"y":236,"size":10},"logo":{"x":320,"y":30,"w":50,"h":50},"company":{"x":25,"y":50,"size":13,"bold":true}}',
 '{"logo":{"x":190,"y":55,"w":70,"h":70},"company":{"x":225,"y":150,"size":16,"bold":true,"color":"accent"},"slogan":{"x":225,"y":175,"size":11}}',
 3, true),

-- 5. Minimal White (minimal)
(gen_random_uuid(), pid, 'Минимал цагаан', 'Минимал цагаан', 'minimal',
 '{"name":{"x":25,"y":70,"size":22,"bold":true,"color":"text"},"title":{"x":25,"y":110,"size":11},"phone":{"x":25,"y":170,"size":11},"email":{"x":25,"y":192,"size":11},"address":{"x":25,"y":214,"size":10},"website":{"x":200,"y":170,"size":10},"logo":{"x":360,"y":25,"w":55,"h":55},"company":{"x":25,"y":135,"size":12,"bold":false}}',
 '{"logo":{"x":200,"y":98,"w":50,"h":50},"company":{"x":225,"y":168,"size":14,"bold":true,"color":"text"},"slogan":{"x":225,"y":188,"size":10}}',
 4, true),

-- 6. Red Bold (bold)
(gen_random_uuid(), pid, 'Улаан идэвхтэй', 'Улаан идэвхтэй', 'full',
 '{"name":{"x":30,"y":50,"size":20,"bold":true,"color":"accent"},"title":{"x":30,"y":74,"size":11},"phone":{"x":55,"y":120,"size":11},"email":{"x":55,"y":142,"size":11},"address":{"x":55,"y":164,"size":10},"website":{"x":55,"y":186,"size":10},"logo":{"x":330,"y":30,"w":50,"h":50},"company":{"x":330,"y":95,"size":12,"bold":true}}',
 '{"logo":{"x":195,"y":60,"w":60,"h":60},"company":{"x":225,"y":145,"size":16,"bold":true,"color":"text"},"slogan":{"x":225,"y":168,"size":11}}',
 5, true),

-- 7. Purple Creative (creative)
(gen_random_uuid(), pid, 'Нил ягаан бүтээлч', 'Нил ягаан бүтээлч', 'creative',
 '{"name":{"x":25,"y":55,"size":20,"bold":true,"color":"accent"},"title":{"x":25,"y":78,"size":11},"phone":{"x":25,"y":130,"size":11},"email":{"x":25,"y":152,"size":11},"address":{"x":25,"y":174,"size":10},"website":{"x":25,"y":196,"size":10},"logo":{"x":310,"y":100,"w":55,"h":55},"company":{"x":310,"y":170,"size":12,"bold":true},"qr":{"x":330,"y":25,"w":60}}',
 '{"logo":{"x":195,"y":55,"w":60,"h":60},"company":{"x":225,"y":135,"size":16,"bold":true,"color":"accent"},"slogan":{"x":225,"y":158,"size":11},"social":{"x":225,"y":200}}',
 6, true),

-- 8. Green Nature (creative)
(gen_random_uuid(), pid, 'Ногоон байгаль', 'Ногоон байгаль', 'creative',
 '{"name":{"x":25,"y":45,"size":20,"bold":true,"color":"text"},"title":{"x":25,"y":68,"size":11},"phone":{"x":50,"y":115,"size":11},"email":{"x":50,"y":137,"size":11},"address":{"x":50,"y":159,"size":10},"website":{"x":50,"y":181,"size":10},"logo":{"x":320,"y":35,"w":55,"h":55},"company":{"x":320,"y":105,"size":13,"bold":true}}',
 '{"logo":{"x":195,"y":60,"w":60,"h":60},"company":{"x":225,"y":140,"size":16,"bold":true,"color":"text"},"slogan":{"x":225,"y":163,"size":11}}',
 7, true),

-- 9. Gray Corporate (corporate)
(gen_random_uuid(), pid, 'Саарал корпорэйт', 'Саарал корпорэйт', 'business',
 '{"name":{"x":25,"y":50,"size":18,"bold":true,"color":"text"},"title":{"x":25,"y":72,"size":11},"phone":{"x":25,"y":125,"size":11},"email":{"x":25,"y":147,"size":11},"address":{"x":25,"y":169,"size":10},"website":{"x":25,"y":191,"size":10},"logo":{"x":320,"y":25,"w":50,"h":50},"company":{"x":320,"y":90,"size":12,"bold":true}}',
 '{"logo":{"x":195,"y":65,"w":60,"h":60},"company":{"x":225,"y":145,"size":16,"bold":true,"color":"text"},"slogan":{"x":225,"y":168,"size":11}}',
 8, true),

-- 10. Gold Premium (dark)
(gen_random_uuid(), pid, 'Алтан дээд зэрэг', 'Алтан дээд зэрэг', 'full',
 '{"name":{"x":30,"y":65,"size":20,"bold":true,"color":"accent"},"title":{"x":30,"y":108,"size":11},"phone":{"x":30,"y":150,"size":11},"email":{"x":30,"y":172,"size":11},"address":{"x":30,"y":194,"size":10},"website":{"x":30,"y":216,"size":10},"logo":{"x":330,"y":30,"w":50,"h":50},"company":{"x":330,"y":100,"size":12,"bold":true}}',
 '{"logo":{"x":195,"y":60,"w":60,"h":60},"company":{"x":225,"y":145,"size":16,"bold":true,"color":"accent"},"slogan":{"x":225,"y":168,"size":11}}',
 9, true),

-- 11. Wave Blue (creative)
(gen_random_uuid(), pid, 'Долгион цэнхэр', 'Долгион цэнхэр', 'creative',
 '{"name":{"x":25,"y":45,"size":20,"bold":true,"color":"accent"},"title":{"x":25,"y":68,"size":11},"phone":{"x":50,"y":115,"size":11},"email":{"x":50,"y":137,"size":11},"address":{"x":50,"y":159,"size":10},"website":{"x":50,"y":181,"size":10},"logo":{"x":320,"y":35,"w":55,"h":55},"company":{"x":320,"y":105,"size":13,"bold":true}}',
 '{"logo":{"x":195,"y":55,"w":60,"h":60},"company":{"x":225,"y":135,"size":16,"bold":true,"color":"text"},"slogan":{"x":225,"y":158,"size":11}}',
 10, true),

-- 12. Sunset Warm (bold)
(gen_random_uuid(), pid, 'Шар улбар', 'Шар улбар', 'full',
 '{"name":{"x":25,"y":50,"size":20,"bold":true,"color":"text"},"title":{"x":25,"y":74,"size":11},"phone":{"x":50,"y":120,"size":11},"email":{"x":50,"y":142,"size":11},"address":{"x":50,"y":164,"size":10},"website":{"x":50,"y":186,"size":10},"logo":{"x":315,"y":30,"w":55,"h":55},"company":{"x":315,"y":100,"size":13,"bold":true}}',
 '{"logo":{"x":195,"y":60,"w":60,"h":60},"company":{"x":225,"y":140,"size":16,"bold":true,"color":"text"},"slogan":{"x":225,"y":163,"size":11}}',
 11, true),

-- 13. Split Dark (dark)
(gen_random_uuid(), pid, 'Хуваасан хар', 'Хуваасан хар', 'full',
 '{"name":{"x":235,"y":40,"size":18,"bold":true,"color":"text"},"title":{"x":235,"y":62,"size":11},"phone":{"x":235,"y":110,"size":10},"email":{"x":235,"y":130,"size":10},"address":{"x":235,"y":150,"size":9},"website":{"x":235,"y":170,"size":9},"logo":{"x":40,"y":40,"w":60,"h":60},"company":{"x":70,"y":130,"size":12,"bold":true}}',
 '{"logo":{"x":195,"y":60,"w":60,"h":60},"company":{"x":225,"y":145,"size":16,"bold":true,"color":"accent"},"slogan":{"x":225,"y":168,"size":11}}',
 12, true),

-- 14. Pink Modern (creative)
(gen_random_uuid(), pid, 'Ягаан орчин үе', 'Ягаан орчин үе', 'creative',
 '{"name":{"x":25,"y":55,"size":20,"bold":true,"color":"accent"},"title":{"x":25,"y":78,"size":11},"phone":{"x":25,"y":130,"size":11},"email":{"x":25,"y":152,"size":11},"address":{"x":25,"y":174,"size":10},"website":{"x":25,"y":196,"size":10},"logo":{"x":320,"y":40,"w":50,"h":50},"company":{"x":320,"y":105,"size":12,"bold":true}}',
 '{"logo":{"x":195,"y":60,"w":60,"h":60},"company":{"x":225,"y":140,"size":16,"bold":true,"color":"text"},"slogan":{"x":225,"y":163,"size":11}}',
 13, true),

-- 15. Stripe Left (corporate)
(gen_random_uuid(), pid, 'Зурвас зүүн', 'Зурвас зүүн', 'business',
 '{"name":{"x":30,"y":45,"size":20,"bold":true,"color":"text"},"title":{"x":30,"y":68,"size":11},"phone":{"x":55,"y":115,"size":11},"email":{"x":55,"y":137,"size":11},"address":{"x":55,"y":159,"size":10},"website":{"x":55,"y":181,"size":10},"logo":{"x":330,"y":30,"w":50,"h":50},"company":{"x":330,"y":95,"size":12,"bold":true}}',
 '{"logo":{"x":195,"y":60,"w":60,"h":60},"company":{"x":225,"y":140,"size":16,"bold":true,"color":"text"},"slogan":{"x":225,"y":163,"size":11}}',
 14, true),

-- 16. Diagonal Cut (bold)
(gen_random_uuid(), pid, 'Диагональ', 'Диагональ', 'full',
 '{"name":{"x":25,"y":50,"size":20,"bold":true,"color":"accent"},"title":{"x":25,"y":74,"size":11},"phone":{"x":50,"y":120,"size":11},"email":{"x":50,"y":142,"size":11},"address":{"x":50,"y":164,"size":10},"website":{"x":50,"y":186,"size":10},"logo":{"x":320,"y":35,"w":55,"h":55},"company":{"x":320,"y":105,"size":13,"bold":true}}',
 '{"logo":{"x":195,"y":55,"w":60,"h":60},"company":{"x":225,"y":135,"size":16,"bold":true,"color":"text"},"slogan":{"x":225,"y":158,"size":11}}',
 15, true),

-- 17. Clean Center (minimal)
(gen_random_uuid(), pid, 'Цэвэр голд', 'Цэвэр голд', 'minimal',
 '{"name":{"x":225,"y":60,"size":22,"bold":true,"color":"text"},"title":{"x":225,"y":105,"size":11},"phone":{"x":225,"y":150,"size":11},"email":{"x":225,"y":172,"size":11},"address":{"x":225,"y":194,"size":10},"website":{"x":225,"y":216,"size":10},"logo":{"x":200,"y":10,"w":50,"h":35},"company":{"x":225,"y":125,"size":11,"bold":false}}',
 '{"logo":{"x":195,"y":103,"w":60,"h":50},"company":{"x":225,"y":168,"size":14,"bold":true,"color":"text"},"slogan":{"x":225,"y":188,"size":10}}',
 16, true),

-- 18. Corner Accent (corporate)
(gen_random_uuid(), pid, 'Булан өнгөт', 'Булан өнгөт', 'business',
 '{"name":{"x":25,"y":105,"size":20,"bold":true,"color":"text"},"title":{"x":25,"y":128,"size":11},"phone":{"x":50,"y":165,"size":11},"email":{"x":50,"y":187,"size":11},"address":{"x":50,"y":209,"size":10},"website":{"x":200,"y":165,"size":10},"logo":{"x":310,"y":25,"w":50,"h":50},"company":{"x":310,"y":90,"size":13,"bold":true}}',
 '{"logo":{"x":195,"y":60,"w":60,"h":60},"company":{"x":225,"y":140,"size":16,"bold":true,"color":"accent"},"slogan":{"x":225,"y":163,"size":11}}',
 17, true),

-- 19. Mono Dark (dark)
(gen_random_uuid(), pid, 'Бүрэн хар', 'Бүрэн хар', 'full',
 '{"name":{"x":25,"y":65,"size":20,"bold":true,"color":"accent"},"title":{"x":25,"y":105,"size":11},"phone":{"x":25,"y":155,"size":11},"email":{"x":25,"y":177,"size":11},"address":{"x":25,"y":199,"size":10},"website":{"x":25,"y":221,"size":10},"logo":{"x":330,"y":30,"w":50,"h":50},"company":{"x":330,"y":95,"size":12,"bold":true}}',
 '{"logo":{"x":200,"y":98,"w":50,"h":50},"company":{"x":225,"y":163,"size":14,"bold":true,"color":"accent"},"slogan":{"x":225,"y":183,"size":10}}',
 18, true),

-- 20. BizPrint Brand (bold)
(gen_random_uuid(), pid, 'BizPrint брэнд', 'BizPrint брэнд', 'full',
 '{"name":{"x":25,"y":50,"size":20,"bold":true,"color":"accent"},"title":{"x":25,"y":74,"size":11},"phone":{"x":50,"y":120,"size":11},"email":{"x":50,"y":142,"size":11},"address":{"x":50,"y":164,"size":10},"website":{"x":50,"y":186,"size":10},"logo":{"x":320,"y":35,"w":55,"h":55},"company":{"x":320,"y":105,"size":13,"bold":true}}',
 '{"logo":{"x":190,"y":55,"w":70,"h":60},"company":{"x":225,"y":140,"size":18,"bold":true,"color":"text"},"slogan":{"x":225,"y":165,"size":12}}',
 19, true);

END $$;
