# ESELLER.MN — НЭГДСЭН АНГИЛАЛЫН СИСТЕМ
## Claude Code Prompt — Category Seed + Admin System

---

## 1. PRISMA SCHEMA

```prisma
model Category {
  id          String     @id @default(cuid())
  slug        String     @unique   // "electronics", "phones"
  name        String               // "Электроник"
  nameEn      String?              // "Electronics"
  icon        String?              // emoji эсвэл icon нэр
  image       String?              // Cloudinary URL
  description String?
  
  parentId    String?              // Эцэг ангилал
  level       Int        @default(0) // 0=үндсэн, 1=дэд, 2=нарийн
  sortOrder   Int        @default(0)
  
  isActive    Boolean    @default(true)
  isApproved  Boolean    @default(true)  // Admin баталгаажуулсан
  isFeatured  Boolean    @default(false) // Нүүр хуудсанд харуулах
  
  // Ямар entity type-д ашиглагдах
  entityTypes String[]   // ['STORE','DIGITAL','PRE_ORDER']
  
  createdBy   String?    // Admin userId
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  parent      Category?   @relation("SubCategories", fields:[parentId], references:[id])
  children    Category[]  @relation("SubCategories")
  products    Product[]
  feedPosts   FeedPost[]
}

// Product болон FeedPost-д нэмэх:
// categoryId  String?
// category    Category? @relation(...)
```

---

## 2. БҮРЭН АНГИЛАЛЫН ЖАГСААЛТ

```typescript
// prisma/seed-categories.ts
// Zary.mn + Монголын зах зээлд тохирсон нэгдсэн ангилал

export const CATEGORIES = [

  // ══════════════════════════════════════
  // 1. ЭЛЕКТРОНИК & ТЕХНОЛОГИ
  // ══════════════════════════════════════
  {
    slug: 'electronics', name: 'Электроник & Технологи',
    icon: '💻', level: 0, sortOrder: 1,
    entityTypes: ['STORE','PRE_ORDER','DIGITAL'],
    isFeatured: true,
    children: [
      {
        slug: 'phones', name: 'Гар утас',
        icon: '📱', sortOrder: 1,
        children: [
          { slug: 'smartphones',     name: 'Ухаалаг утас' },
          { slug: 'phone-cases',     name: 'Утасны хэрэгсэл' },
          { slug: 'phone-chargers',  name: 'Цэнэглэгч & Кабель' },
          { slug: 'phone-screens',   name: 'Дэлгэц & Сэлбэг' },
        ]
      },
      {
        slug: 'computers', name: 'Компьютер & Зөөврийн',
        icon: '🖥', sortOrder: 2,
        children: [
          { slug: 'laptops',         name: 'Зөөврийн компьютер' },
          { slug: 'desktops',        name: 'Суурин компьютер' },
          { slug: 'computer-parts',  name: 'Компьютерийн сэлбэг' },
          { slug: 'monitors',        name: 'Монитор & Дэлгэц' },
          { slug: 'keyboards-mice',  name: 'Гар & Хулгана' },
          { slug: 'storage',         name: 'Хадгалах хэрэгсэл' },
        ]
      },
      {
        slug: 'tv-audio', name: 'Зурагт & Аудио',
        icon: '📺', sortOrder: 3,
        children: [
          { slug: 'tvs',             name: 'Зурагт & Телевизор' },
          { slug: 'speakers',        name: 'Чанга яригч' },
          { slug: 'headphones',      name: 'Чихэвч' },
          { slug: 'projectors',      name: 'Проектор' },
        ]
      },
      {
        slug: 'cameras', name: 'Камер & Зураг',
        icon: '📷', sortOrder: 4,
        children: [
          { slug: 'digital-cameras', name: 'Дижитал камер' },
          { slug: 'action-cameras',  name: 'Экшн камер' },
          { slug: 'drones',          name: 'Дрон' },
          { slug: 'camera-accessories', name: 'Камерийн хэрэгсэл' },
        ]
      },
      {
        slug: 'smart-devices', name: 'Ухаалаг төхөөрөмж',
        icon: '⌚', sortOrder: 5,
        children: [
          { slug: 'smart-watches',   name: 'Ухаалаг цаг' },
          { slug: 'smart-home',      name: 'Ухаалаг гэр' },
          { slug: 'vr-ar',           name: 'VR/AR төхөөрөмж' },
        ]
      },
      { slug: 'gaming',    name: 'Тоглоомын хэрэгсэл', icon: '🎮', sortOrder: 6 },
      { slug: 'printers',  name: 'Принтер & Сканнер',  icon: '🖨', sortOrder: 7 },
    ]
  },

  // ══════════════════════════════════════
  // 2. ХУВЦАС & ГУТАЛ
  // ══════════════════════════════════════
  {
    slug: 'fashion', name: 'Хувцас & Гутал',
    icon: '👗', level: 0, sortOrder: 2,
    entityTypes: ['STORE','PRE_ORDER'],
    isFeatured: true,
    children: [
      {
        slug: 'womens-clothing', name: 'Эмэгтэй хувцас',
        icon: '👚', sortOrder: 1,
        children: [
          { slug: 'womens-tops',     name: 'Дээд хувцас' },
          { slug: 'womens-bottoms',  name: 'Доод хувцас' },
          { slug: 'womens-dresses',  name: 'Даашинз & Юбка' },
          { slug: 'womens-outerwear',name: 'Дотуур хувцас' },
          { slug: 'womens-coats',    name: 'Пальто & Куртк' },
        ]
      },
      {
        slug: 'mens-clothing', name: 'Эрэгтэй хувцас',
        icon: '👔', sortOrder: 2,
        children: [
          { slug: 'mens-tops',       name: 'Дээд хувцас' },
          { slug: 'mens-bottoms',    name: 'Доод хувцас' },
          { slug: 'mens-suits',      name: 'Костюм & Дүрэмт' },
          { slug: 'mens-coats',      name: 'Пальто & Куртк' },
        ]
      },
      {
        slug: 'kids-clothing', name: 'Хүүхдийн хувцас',
        icon: '👶', sortOrder: 3,
        children: [
          { slug: 'baby-clothing',   name: 'Нярайн хувцас (0-2)' },
          { slug: 'toddler-clothing',name: 'Бага насны (2-7)' },
          { slug: 'kids-tops',       name: 'Хүүхдийн дээд' },
          { slug: 'kids-bottoms',    name: 'Хүүхдийн доод' },
        ]
      },
      {
        slug: 'shoes', name: 'Гутал',
        icon: '👟', sortOrder: 4,
        children: [
          { slug: 'womens-shoes',    name: 'Эмэгтэй гутал' },
          { slug: 'mens-shoes',      name: 'Эрэгтэй гутал' },
          { slug: 'kids-shoes',      name: 'Хүүхдийн гутал' },
          { slug: 'sports-shoes',    name: 'Спортын гутал' },
          { slug: 'boots',           name: 'Гутал & Арслан' },
        ]
      },
      {
        slug: 'bags', name: 'Цүнх & Аксессуар',
        icon: '👜', sortOrder: 5,
        children: [
          { slug: 'handbags',        name: 'Цүнх' },
          { slug: 'backpacks',       name: 'Нуруувч' },
          { slug: 'wallets',         name: 'Хэтэвч' },
          { slug: 'belts-ties',      name: 'Бүс & Зангиа' },
          { slug: 'hats-scarves',    name: 'Малгай & Ороолт' },
          { slug: 'sunglasses',      name: 'Нарны шил' },
        ]
      },
      { slug: 'traditional-clothing', name: 'Үндэсний хувцас', icon: '🥻', sortOrder: 6 },
      { slug: 'workwear',         name: 'Ажлын хувцас',    icon: '🦺', sortOrder: 7 },
      { slug: 'sportswear',       name: 'Спортын хувцас',  icon: '🏃', sortOrder: 8 },
    ]
  },

  // ══════════════════════════════════════
  // 3. ГЭР АХУй & ТАВИЛГА
  // ══════════════════════════════════════
  {
    slug: 'home-living', name: 'Гэр Ахуй & Тавилга',
    icon: '🏠', level: 0, sortOrder: 3,
    entityTypes: ['STORE','PRE_ORDER'],
    isFeatured: true,
    children: [
      {
        slug: 'furniture', name: 'Тавилга',
        icon: '🛋', sortOrder: 1,
        children: [
          { slug: 'sofas-armchairs', name: 'Диван & Сандал' },
          { slug: 'beds',            name: 'Ор & Матрас' },
          { slug: 'tables-chairs',   name: 'Ширээ & Сандал' },
          { slug: 'wardrobes',       name: 'Шкаф & Сейф' },
          { slug: 'shelves-racks',   name: 'Тавиур & Шифоньер' },
          { slug: 'office-furniture',name: 'Оффисын тавилга' },
        ]
      },
      {
        slug: 'kitchen', name: 'Гал тогооны хэрэгсэл',
        icon: '🍳', sortOrder: 2,
        children: [
          { slug: 'cookware',        name: 'Тогоо & Таваг' },
          { slug: 'kitchen-appliances', name: 'Жижиг цахилгаан' },
          { slug: 'tableware',       name: 'Аяга таваг' },
          { slug: 'storage-containers', name: 'Хадгалах сав' },
        ]
      },
      {
        slug: 'home-decor', name: 'Гэрийн чимэглэл',
        icon: '🖼', sortOrder: 3,
        children: [
          { slug: 'wall-decor',      name: 'Ханын чимэглэл' },
          { slug: 'lighting',        name: 'Гэрэлтүүлэг' },
          { slug: 'carpets-rugs',    name: 'Хивс & Дэвсгэр' },
          { slug: 'curtains',        name: 'Хөшиг & Жалаа' },
          { slug: 'plants-pots',     name: 'Ургамал & Сав' },
        ]
      },
      {
        slug: 'bedding', name: 'Унтлагын хэрэгсэл',
        icon: '🛏', sortOrder: 4,
        children: [
          { slug: 'blankets-pillows',name: 'Хөнжил & Дэр' },
          { slug: 'bed-sheets',      name: 'Орны даавуу' },
          { slug: 'towels',          name: 'Алчуур' },
        ]
      },
      {
        slug: 'large-appliances', name: 'Том цахилгаан',
        icon: '🧺', sortOrder: 5,
        children: [
          { slug: 'refrigerators',   name: 'Хөргөгч' },
          { slug: 'washing-machines',name: 'Угаалгын машин' },
          { slug: 'air-conditioners',name: 'Агааржуулагч' },
          { slug: 'vacuum-cleaners', name: 'Тоос сорогч' },
          { slug: 'water-heaters',   name: 'Халуун ус' },
        ]
      },
      { slug: 'garden-outdoor',  name: 'Цэцэрлэг & Гадна', icon: '🌿', sortOrder: 6 },
      { slug: 'cleaning',        name: 'Цэвэрлэгээний хэрэгсэл', icon: '🧹', sortOrder: 7 },
      { slug: 'ger-supplies',    name: 'Гэрийн хэрэгсэл', icon: '🏕', sortOrder: 8 },
    ]
  },

  // ══════════════════════════════════════
  // 4. ГОО САЙХАН & ЭРҮҮЛ МЭНД
  // ══════════════════════════════════════
  {
    slug: 'beauty-health', name: 'Гоо Сайхан & Эрүүл Мэнд',
    icon: '💄', level: 0, sortOrder: 4,
    entityTypes: ['STORE','PRE_ORDER'],
    isFeatured: true,
    children: [
      {
        slug: 'skincare', name: 'Арьс засах',
        icon: '🧴', sortOrder: 1,
        children: [
          { slug: 'face-care',       name: 'Нүүрний арчилгаа' },
          { slug: 'body-care',       name: 'Биеийн арчилгаа' },
          { slug: 'sunscreen',       name: 'Нарнаас хамгаалах' },
        ]
      },
      {
        slug: 'makeup', name: 'Гоо сайхны бараа',
        icon: '💅', sortOrder: 2,
        children: [
          { slug: 'face-makeup',     name: 'Нүүрний будаг' },
          { slug: 'eye-makeup',      name: 'Нүдний будаг' },
          { slug: 'lip-products',    name: 'Уруулын будаг' },
          { slug: 'nail-care',       name: 'Хумсны арчилгаа' },
        ]
      },
      {
        slug: 'hair-care', name: 'Үсний арчилгаа',
        icon: '💇', sortOrder: 3,
        children: [
          { slug: 'shampoo-conditioner', name: 'Шампунь & Бальзам' },
          { slug: 'hair-styling',    name: 'Үс засах' },
          { slug: 'hair-tools',      name: 'Үсний хэрэгсэл' },
        ]
      },
      {
        slug: 'health-wellness', name: 'Эрүүл мэнд',
        icon: '💊', sortOrder: 4,
        children: [
          { slug: 'vitamins-supplements', name: 'Витамин & Нэмэлт' },
          { slug: 'medical-devices', name: 'Эмнэлгийн хэрэгсэл' },
          { slug: 'first-aid',       name: 'Анхны тусламж' },
          { slug: 'personal-care',   name: 'Хувийн арчилгаа' },
        ]
      },
      {
        slug: 'fragrances', name: 'Үнэртэн & Ариун цэвэр',
        icon: '🌸', sortOrder: 5,
        children: [
          { slug: 'perfumes',        name: 'Үнэртэн' },
          { slug: 'deodorants',      name: 'Дезодорант' },
        ]
      },
    ]
  },

  // ══════════════════════════════════════
  // 5. ХҮҮХДИЙН БАРАА
  // ══════════════════════════════════════
  {
    slug: 'kids-toys', name: 'Хүүхдийн Бараа & Тоглоом',
    icon: '🧸', level: 0, sortOrder: 5,
    entityTypes: ['STORE','PRE_ORDER'],
    children: [
      { slug: 'baby-essentials',   name: 'Нярайн хэрэгсэл', icon: '🍼', sortOrder: 1 },
      { slug: 'toys',              name: 'Тоглоом',           icon: '🎯', sortOrder: 2,
        children: [
          { slug: 'educational-toys', name: 'Сургалтын тоглоом' },
          { slug: 'action-figures',   name: 'Дүрс & Машин' },
          { slug: 'lego-blocks',      name: 'Лего & Блок' },
          { slug: 'outdoor-toys',     name: 'Гадна тоглоом' },
          { slug: 'dolls',            name: 'Хүүхэлдэй' },
        ]
      },
      { slug: 'school-supplies',   name: 'Сургуулийн хэрэгсэл', icon: '🎒', sortOrder: 3 },
      { slug: 'strollers-carseats',name: 'Тэрэг & Суудал',    icon: '🚼', sortOrder: 4 },
      { slug: 'kids-furniture',    name: 'Хүүхдийн тавилга', icon: '🪑', sortOrder: 5 },
    ]
  },

  // ══════════════════════════════════════
  // 6. СПОРТ & АЯЛАЛ
  // ══════════════════════════════════════
  {
    slug: 'sports-travel', name: 'Спорт & Аялал',
    icon: '⚽', level: 0, sortOrder: 6,
    entityTypes: ['STORE','PRE_ORDER'],
    children: [
      {
        slug: 'team-sports', name: 'Баг спорт',
        icon: '🏈', sortOrder: 1,
        children: [
          { slug: 'football',        name: 'Хөлбөмбөг' },
          { slug: 'basketball',      name: 'Сагсан бөмбөг' },
          { slug: 'volleyball',      name: 'Волейбол' },
          { slug: 'boxing',          name: 'Бокс & Тулааны урлаг' },
        ]
      },
      {
        slug: 'fitness', name: 'Фитнесс & Тамир',
        icon: '🏋', sortOrder: 2,
        children: [
          { slug: 'gym-equipment',   name: 'Фитнессийн тоног' },
          { slug: 'yoga-pilates',    name: 'Йога & Пилатес' },
          { slug: 'running',         name: 'Гүйлт & Алхалт' },
        ]
      },
      {
        slug: 'outdoor-sports', name: 'Гадна спорт',
        icon: '🏔', sortOrder: 3,
        children: [
          { slug: 'cycling',         name: 'Дугуй' },
          { slug: 'skiing',          name: 'Гулгалт & Өвлийн спорт' },
          { slug: 'fishing',         name: 'Загасчлал' },
          { slug: 'hunting',         name: 'Ан агнуур' },
        ]
      },
      {
        slug: 'travel', name: 'Аялал',
        icon: '✈', sortOrder: 4,
        children: [
          { slug: 'luggage',         name: 'Чемодан & Цүнх' },
          { slug: 'camping',         name: 'Явган аялал' },
          { slug: 'travel-accessories', name: 'Аяллын хэрэгсэл' },
        ]
      },
      { slug: 'swimming',    name: 'Усан сэлэлт',   icon: '🏊', sortOrder: 5 },
      { slug: 'tennis',      name: 'Теннис',         icon: '🎾', sortOrder: 6 },
      { slug: 'scooters-boards', name: 'Скутер & Борд', icon: '🛴', sortOrder: 7 },
    ]
  },

  // ══════════════════════════════════════
  // 7. ХОЛ & УНД
  // ══════════════════════════════════════
  {
    slug: 'food-beverage', name: 'Хол & Унд',
    icon: '🍜', level: 0, sortOrder: 7,
    entityTypes: ['STORE','PRE_ORDER'],
    children: [
      { slug: 'fresh-food',      name: 'Шинэ хүнс',       icon: '🥩', sortOrder: 1 },
      { slug: 'packaged-food',   name: 'Боодолтой хүнс',  icon: '🥫', sortOrder: 2 },
      { slug: 'beverages',       name: 'Ундаа',            icon: '🥤', sortOrder: 3 },
      { slug: 'snacks',          name: 'Жигнэмэг & Чихэр',icon: '🍫', sortOrder: 4 },
      { slug: 'dairy',           name: 'Сүүн бүтээгдэхүүн',icon: '🥛', sortOrder: 5 },
      { slug: 'organic-food',    name: 'Органик хүнс',    icon: '🌾', sortOrder: 6 },
      { slug: 'mongolian-food',  name: 'Монгол хүнс',     icon: '🍖', sortOrder: 7 },
    ]
  },

  // ══════════════════════════════════════
  // 8. НОМ & БОЛОВСРОЛ
  // ══════════════════════════════════════
  {
    slug: 'books-education', name: 'Ном & Боловсрол',
    icon: '📚', level: 0, sortOrder: 8,
    entityTypes: ['STORE','DIGITAL','PRE_ORDER'],
    children: [
      { slug: 'mongolian-books', name: 'Монгол ном',       icon: '📖', sortOrder: 1 },
      { slug: 'textbooks',       name: 'Сурах бичиг',      icon: '📝', sortOrder: 2 },
      { slug: 'childrens-books', name: 'Хүүхдийн ном',     icon: '🎨', sortOrder: 3 },
      { slug: 'stationery',      name: 'Бичиг хэрэг',      icon: '✏', sortOrder: 4 },
      { slug: 'art-supplies',    name: 'Зургийн хэрэгсэл', icon: '🎭', sortOrder: 5 },
      { slug: 'e-books',         name: 'Цахим ном',        icon: '📱', sortOrder: 6 },
      { slug: 'online-courses',  name: 'Онлайн курс',      icon: '🎓', sortOrder: 7 },
    ]
  },

  // ══════════════════════════════════════
  // 9. АВТО & МОТО
  // ══════════════════════════════════════
  {
    slug: 'auto-moto', name: 'Авто & Мото',
    icon: '🚗', level: 0, sortOrder: 9,
    entityTypes: ['STORE','AUTO'],
    children: [
      {
        slug: 'car-accessories', name: 'Автомашины аксессуар',
        icon: '🔧', sortOrder: 1,
        children: [
          { slug: 'car-electronics',   name: 'Авто электроник' },
          { slug: 'car-lights',        name: 'Автомашины гэрэл' },
          { slug: 'car-tires',         name: 'Дугуй & Обод' },
          { slug: 'car-interior',      name: 'Дотор чимэглэл' },
          { slug: 'car-exterior',      name: 'Гадна хэрэгсэл' },
          { slug: 'car-audio',         name: 'Авто аудио' },
        ]
      },
      {
        slug: 'car-parts', name: 'Авто эд анги',
        icon: '⚙', sortOrder: 2,
        children: [
          { slug: 'engine-parts',      name: 'Хөдөлгүүрийн эд анги' },
          { slug: 'brake-system',      name: 'Тоормосны систем' },
          { slug: 'suspension-parts',  name: 'Явах эд анги' },
          { slug: 'body-parts',        name: 'Их биений эд анги' },
          { slug: 'oil-filters',       name: 'Тос & Шүүлтүүр' },
        ]
      },
      {
        slug: 'motorcycle', name: 'Мотоцикл',
        icon: '🏍', sortOrder: 3,
        children: [
          { slug: 'motorcycle-parts',  name: 'Мото эд анги' },
          { slug: 'moto-gear',         name: 'Мотоны хувцас' },
        ]
      },
      { slug: 'car-care',    name: 'Авто арчилгаа',    icon: '🚿', sortOrder: 4 },
      { slug: 'car-tools',   name: 'Авто хэрэгсэл',   icon: '🔩', sortOrder: 5 },
    ]
  },

  // ══════════════════════════════════════
  // 10. БАРИЛГА & ЗАСВАР
  // ══════════════════════════════════════
  {
    slug: 'construction', name: 'Барилга & Засвар',
    icon: '🔨', level: 0, sortOrder: 10,
    entityTypes: ['STORE','CONSTRUCTION'],
    children: [
      { slug: 'building-materials', name: 'Барилгын материал', icon: '🧱', sortOrder: 1 },
      { slug: 'tools',              name: 'Хэрэгсэл & Багаж',  icon: '🔧', sortOrder: 2 },
      { slug: 'plumbing',           name: 'Усны хэрэгсэл',     icon: '🚿', sortOrder: 3 },
      { slug: 'electrical',         name: 'Цахилгааны хэрэгсэл', icon: '⚡', sortOrder: 4 },
      { slug: 'flooring',           name: 'Шал & Хана',        icon: '🪟', sortOrder: 5 },
      { slug: 'paint-supplies',     name: 'Будаг & Хэрэгсэл', icon: '🎨', sortOrder: 6 },
      { slug: 'hardware',           name: 'Металл бараа',      icon: '🔩', sortOrder: 7 },
    ]
  },

  // ══════════════════════════════════════
  // 11. ГОёЛ ЧИМЭГЛЭЛ & БЭЛЭГ
  // ══════════════════════════════════════
  {
    slug: 'jewelry-gifts', name: 'Гоёл Чимэглэл & Бэлэг',
    icon: '💍', level: 0, sortOrder: 11,
    entityTypes: ['STORE','PRE_ORDER'],
    children: [
      { slug: 'jewelry',          name: 'Чимэглэл',          icon: '💎', sortOrder: 1 },
      { slug: 'watches',          name: 'Цаг',                icon: '⌚', sortOrder: 2 },
      { slug: 'gifts',            name: 'Бэлэг',              icon: '🎁', sortOrder: 3 },
      { slug: 'flowers',          name: 'Цэцэг',              icon: '💐', sortOrder: 4 },
      { slug: 'souvenirs',        name: 'Дурсгалын зүйл',    icon: '🏺', sortOrder: 5 },
      { slug: 'mongolian-crafts', name: 'Монгол гар урлал',  icon: '🪬', sortOrder: 6 },
    ]
  },

  // ══════════════════════════════════════
  // 12. МАЛ АМЬТАН
  // ══════════════════════════════════════
  {
    slug: 'pets', name: 'Мал Амьтан',
    icon: '🐾', level: 0, sortOrder: 12,
    entityTypes: ['STORE'],
    children: [
      { slug: 'dog-supplies',     name: 'Нохойн хэрэгсэл',  icon: '🐕', sortOrder: 1 },
      { slug: 'cat-supplies',     name: 'Муурны хэрэгсэл',  icon: '🐈', sortOrder: 2 },
      { slug: 'pet-food',         name: 'Тэжээл',            icon: '🦴', sortOrder: 3 },
      { slug: 'pet-accessories',  name: 'Аксессуар',         icon: '🎀', sortOrder: 4 },
      { slug: 'livestock',        name: 'Малын тоног',       icon: '🐄', sortOrder: 5 },
    ]
  },

  // ══════════════════════════════════════
  // 13. УРЛАГ & ХӨГЖИМ
  // ══════════════════════════════════════
  {
    slug: 'arts-music', name: 'Урлаг & Хөгжим',
    icon: '🎵', level: 0, sortOrder: 13,
    entityTypes: ['STORE','DIGITAL'],
    children: [
      { slug: 'musical-instruments', name: 'Хөгжмийн зэмсэг', icon: '🎸', sortOrder: 1 },
      { slug: 'music-accessories',   name: 'Хөгжмийн хэрэгсэл', icon: '🎹', sortOrder: 2 },
      { slug: 'art-materials',       name: 'Зургийн материал',  icon: '🖌', sortOrder: 3 },
      { slug: 'craft-supplies',      name: 'Гар урлалын хэрэгсэл', icon: '✂', sortOrder: 4 },
      { slug: 'digital-music',       name: 'Цахим хөгжим',      icon: '🎧', sortOrder: 5 },
    ]
  },

  // ══════════════════════════════════════
  // 14. ДИЖИТАЛ БАРАА & ПРОГРАМ
  // ══════════════════════════════════════
  {
    slug: 'digital-goods', name: 'Дижитал Бараа & Програм',
    icon: '💾', level: 0, sortOrder: 14,
    entityTypes: ['DIGITAL'],
    children: [
      { slug: 'software',         name: 'Програм хангамж',   icon: '💻', sortOrder: 1 },
      { slug: 'templates',        name: 'Загвар & Template',  icon: '📋', sortOrder: 2 },
      { slug: 'digital-art',      name: 'Дижитал урлаг',     icon: '🎨', sortOrder: 3 },
      { slug: 'fonts',            name: 'Фонт & Дизайн',     icon: '🔤', sortOrder: 4 },
      { slug: 'presets',          name: 'Preset & Filter',    icon: '📷', sortOrder: 5 },
      { slug: 'ebooks-courses',   name: 'Ном & Курс',        icon: '📚', sortOrder: 6 },
      { slug: 'game-items',       name: 'Тоглоомын эд',      icon: '🎮', sortOrder: 7 },
    ]
  },

  // ══════════════════════════════════════
  // 15. ХӨДӨӨ АЖ АХУЙ
  // ══════════════════════════════════════
  {
    slug: 'agriculture', name: 'Хөдөө Аж Ахуй',
    icon: '🌾', level: 0, sortOrder: 15,
    entityTypes: ['STORE','PRE_ORDER'],
    children: [
      { slug: 'seeds-plants',     name: 'Үр & Ургамал',      icon: '🌱', sortOrder: 1 },
      { slug: 'farming-tools',    name: 'Тариалангийн хэрэгсэл', icon: '🚜', sortOrder: 2 },
      { slug: 'animal-feed',      name: 'Малын тэжээл',      icon: '🌿', sortOrder: 3 },
      { slug: 'vet-supplies',     name: 'Малын эм & хэрэгсэл', icon: '💉', sortOrder: 4 },
      { slug: 'greenhouse',       name: 'Хүлэмжийн хэрэгсэл', icon: '🌡', sortOrder: 5 },
    ]
  },

  // ══════════════════════════════════════
  // 16. ОФФИС & БИЗНЕС
  // ══════════════════════════════════════
  {
    slug: 'office-business', name: 'Оффис & Бизнес',
    icon: '💼', level: 0, sortOrder: 16,
    entityTypes: ['STORE','DIGITAL'],
    children: [
      { slug: 'office-supplies',  name: 'Оффисын хэрэгсэл',  icon: '📎', sortOrder: 1 },
      { slug: 'printers-supplies',name: 'Принтер & Картридж', icon: '🖨', sortOrder: 2 },
      { slug: 'office-furniture-biz', name: 'Оффисын тавилга', icon: '🪑', sortOrder: 3 },
      { slug: 'pos-systems',      name: 'POS систем',         icon: '💳', sortOrder: 4 },
      { slug: 'signage',          name: 'Самбар & Тэмдэглэл', icon: '🪧', sortOrder: 5 },
    ]
  },
]
```

---

## 3. SEED ФУНКЦ

```typescript
// prisma/seed-categories.ts — seed хийх функц

async function seedCategories(
  cats: any[],
  parentId: string | null = null,
  level: number = 0
) {
  for (const cat of cats) {
    const { children, ...data } = cat

    const created = await db.category.upsert({
      where:  { slug: data.slug },
      update: { ...data, parentId, level },
      create: { ...data, parentId, level },
    })

    if (children?.length) {
      await seedCategories(children, created.id, level + 1)
    }
  }
}

// seed.ts-д нэмэх:
await seedCategories(CATEGORIES)
console.log('✓ Ангилал seed хийгдлээ')
```

---

## 4. ADMIN АНГИЛАЛЫН ХЯНАЛТ

```
/admin/categories/page.tsx:

Tree view — Эцэг → дэд → нарийн
Drag & drop эрэмбэ
CRUD: нэмэх / засах / идэвхгүй болгох
Шинэ ангилалын хүсэлт — дэлгүүр эзэд илгээнэ
  → Admin зөвшөөрнө → нийтийн ангилал болно

/admin/categories/requests/page.tsx:
  Дэлгүүр эзэдийн шинэ ангилалын хүсэлт
  Approve → Category.isApproved = true → нийтэд харагдана
  Reject + шалтгаан
```

---

## 5. ХЭРЭГЖИЛТИЙН ДАРААЛАЛ

```
1. Prisma migration:
   Category model нэмэх
   Product, FeedPost-д categoryId нэмэх
   npx prisma migrate dev --name add_category_system

2. prisma/seed-categories.ts үүсгэх
   (дээрх CATEGORIES array)

3. seed.ts-д import хийж ажиллуулах:
   npx prisma db seed

4. /admin/categories хуудас
   Tree UI, CRUD, хүсэлт хяналт

5. Бараа нэмэх форм-д CategorySelector нэмэх:
   2-level select: Үндсэн → дэд ангилал

6. Feed filter-д category нэмэх:
   /feed?category=electronics

7. Store-д default category тохируулах

Нийт: 16 үндсэн + 100+ дэд ангилал
```
