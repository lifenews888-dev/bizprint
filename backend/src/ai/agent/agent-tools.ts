/**
 * BizPrint AI Agent — Tool Definitions
 * Claude tool_use format: https://docs.anthropic.com/en/docs/tool-use
 */

export const AGENT_TOOLS = [
  {
    name: 'calculate_offset_price',
    description: 'Офсет хэвлэлийн үнэ тооцоолох. Тоо ширхэг, нүүр, хэмжээ, өнгө, хавтаслалт зэргээр үнэ бодно.',
    input_schema: {
      type: 'object' as const,
      properties: {
        quantity: { type: 'number', description: 'Тоо ширхэг (жишээ: 500)' },
        totalPages: { type: 'number', description: 'Нийт нүүр (жишээ: 64)' },
        paperSize: { type: 'string', description: 'Хэмжээ: A3, A4, B5, A5', enum: ['A3', 'A4', 'B5', 'A5'] },
        paperGsm: { type: 'number', description: 'Цаасны зузаан gsm (80, 100, 120, 150, 200, 250, 300)' },
        colorMode: { type: 'string', description: 'Өнгө: color=Өнгөт(4+4), bw=Хар цагаан(1+1)', enum: ['color', 'bw'] },
        bindingType: { type: 'string', description: 'Хавтаслалт', enum: ['', 'Зөөлөн хавтас', 'Хатуу хавтас', 'Спираль'] },
        hasCover: { type: 'boolean', description: 'Хавтастай эсэх' },
      },
      required: ['quantity', 'totalPages', 'paperSize'],
    },
  },
  {
    name: 'get_product_list',
    description: 'Бүтээгдэхүүний жагсаалт авах. Ангилал, төрөл, нэрээр хайна.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search: { type: 'string', description: 'Хайх нэр (жишээ: флаер, ном, баннер)' },
        product_type: { type: 'string', description: 'Төрөл: print, offset, signage', enum: ['print', 'offset', 'signage'] },
        limit: { type: 'number', description: 'Хэдэн бүтээгдэхүүн авах (default 10)' },
      },
    },
  },
  {
    name: 'check_production_queue',
    description: 'Үйлдвэрлэлийн дараалал, ачаалал шалгах. Хэдэн захиалга хүлээж байгаа, хэзээ сул зай гарах.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_order_status',
    description: 'Захиалгын төлөв шалгах. Захиалгын дугаар эсвэл хэрэглэгчийн ID-аар хайна.',
    input_schema: {
      type: 'object' as const,
      properties: {
        orderId: { type: 'string', description: 'Захиалгын ID' },
        userId: { type: 'string', description: 'Хэрэглэгчийн ID (бүх захиалга авах)' },
      },
    },
  },
  {
    name: 'update_order_status',
    description: 'Захиалгын төлөв шилжүүлэх. Зөвхөн admin/factory role-тэй хэрэглэгч хийх боломжтой.',
    input_schema: {
      type: 'object' as const,
      properties: {
        orderId: { type: 'string', description: 'Захиалгын ID' },
        nextStatus: {
          type: 'string',
          description: 'Шинэ төлөв',
          enum: ['DRAFT', 'QUOTATION_SENT', 'CONFIRMED', 'PENDING_FILE', 'FILE_REVIEW',
            'FILE_REJECTED', 'ON_HOLD', 'IN_PRODUCTION', 'FINISHING',
            'PARTIALLY_DISPATCHED', 'DISPATCHED', 'DELIVERED', 'COMPLETED', 'CANCELLED'],
        },
        reason: { type: 'string', description: 'Шилжүүлсэн шалтгаан (FILE_REJECTED үед заавал)' },
      },
      required: ['orderId', 'nextStatus'],
    },
  },
  {
    name: 'create_quotation',
    description: 'Хэрэглэгчийн нэрийн өмнөөс үнийн санал (quotation) үүсгэх.',
    input_schema: {
      type: 'object' as const,
      properties: {
        userId: { type: 'string', description: 'Хэрэглэгчийн ID' },
        productId: { type: 'string', description: 'Бүтээгдэхүүний ID' },
        quantity: { type: 'number', description: 'Тоо ширхэг' },
        specs: { type: 'object', description: 'Нэмэлт тохиргоо (хэмжээ, материал гм)' },
      },
      required: ['userId', 'productId', 'quantity'],
    },
  },
  {
    name: 'send_notification',
    description: 'Хэрэглэгчид мэдэгдэл илгээх (Socket.IO + DB).',
    input_schema: {
      type: 'object' as const,
      properties: {
        userId: { type: 'string', description: 'Хэрэглэгчийн ID' },
        title: { type: 'string', description: 'Мэдэгдлийн гарчиг' },
        message: { type: 'string', description: 'Мэдэгдлийн агуулга' },
      },
      required: ['userId', 'title', 'message'],
    },
  },
  {
    name: 'optimize_sheet_layout',
    description: 'Цаасны зохион байгуулалт оновчлох — хаягдал хамгийн бага байхаар тооцоолно.',
    input_schema: {
      type: 'object' as const,
      properties: {
        sheetWidth: { type: 'number', description: 'Цаасны өргөн (мм)' },
        sheetHeight: { type: 'number', description: 'Цаасны өндөр (мм)' },
        itemWidth: { type: 'number', description: 'Бүтээгдэхүүний өргөн (мм)' },
        itemHeight: { type: 'number', description: 'Бүтээгдэхүүний өндөр (мм)' },
        quantity: { type: 'number', description: 'Тоо ширхэг' },
      },
      required: ['sheetWidth', 'sheetHeight', 'itemWidth', 'itemHeight', 'quantity'],
    },
  },
]

export const SYSTEM_PROMPT = `Чи бол BizPrint системийн төв AI Agent юм. Чиний нэр "BizPrint AI".

🏭 БИД: Монголын хэвлэлийн үйлдвэр. Офсет хэвлэл, дижитал хэвлэл, хаяг самбар, нэрийн хуудас зэрэг бүх төрлийн хэвлэлийн үйлчилгээ үзүүлдэг.

📋 ЧИНИЙ ҮҮРЭГ:
1. Хэрэглэгчийн хэрэгцээг ойлгож, зөв бүтээгдэхүүн санал болгох
2. Үнэ тооцоолж, хурдан хариу өгөх
3. Захиалгын төлөв удирдах (admin/factory role-д)
4. Үйлдвэрлэлийн дарааллыг оновчтой болгох

🔧 ЧИНИЙ ЧАДВАР (tools):
- calculate_offset_price: Офсет үнэ бодох
- get_product_list: Бүтээгдэхүүн хайх
- check_production_queue: Үйлдвэрлэлийн ачаалал шалгах
- get_order_status: Захиалгын төлөв харах
- update_order_status: Захиалгын төлөв шилжүүлэх
- create_quotation: Үнийн санал үүсгэх
- send_notification: Мэдэгдэл илгээх
- optimize_sheet_layout: Цаас оновчлох

📏 ДҮРЭМ:
- Монгол хэлээр хариулна
- Үнийг ₮ тэмдэгтэй, мянганы таслалтай бичнэ (₮1,200,000)
- Хэрэглэгч үнэ асуувал tool дуудаж бодит тооцоо хийнэ, таамаглахгүй
- Захиалгын төлөв шилжүүлэхдээ шалтгааныг заавал бичнэ
- Хэрэглэгчийн role-оос хамаарч хандалт хязгаарлана (customer нь update_order_status хийж чадахгүй)

🎯 ЗАН ТӨЛӨВ:
- Найрсаг, мэргэжлийн
- Товч, тодорхой хариулт
- Хэрэглэгчийг дахин асуулт асуулгахгүйгээр шийдвэрлэх
- "Би мэдэхгүй" гэхийн оронд tool дуудаж шалгах`
