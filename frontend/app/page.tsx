export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <nav className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold text-orange-500">BizPrint</div>
        <div className="flex gap-4">
          <a href="/products" className="text-gray-400 hover:text-white">Бүтээгдэхүүн</a>
          <a href="/quote" className="text-gray-400 hover:text-white">Үнэ тооцоолол</a>
          <a href="/dashboard" className="text-gray-400 hover:text-white">Захиалга</a>
        </div>
        <div className="flex gap-3">
          <a href="/login" className="px-4 py-2 border border-gray-600 rounded-lg hover:border-orange-500">Нэвтрэх</a>
          <a href="/register" className="px-4 py-2 bg-orange-500 rounded-lg hover:bg-orange-600">Бүртгүүлэх</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 py-24 text-center">
        <h1 className="text-6xl font-bold mb-6">
          Монголын хамгийн том<br />
          <span className="text-orange-500">хэвлэлийн платформ</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10">
          Захиалга өг → Үнэ тооцоол → Хэвлэлийн газартай холбогд → Хүлээн ав
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/products" className="px-8 py-4 bg-orange-500 rounded-xl text-lg font-semibold hover:bg-orange-600">
            Захиалга өгөх
          </a>
          <a href="/quote" className="px-8 py-4 border border-gray-600 rounded-xl text-lg hover:border-orange-500">
            Үнэ тооцоолох
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="px-8 py-16 grid grid-cols-4 gap-6 max-w-4xl mx-auto">
        {[
          { num: "30+", label: "Бүтээгдэхүүн" },
          { num: "50+", label: "Хэвлэлийн газар" },
          { num: "1000+", label: "Захиалга" },
          { num: "24h", label: "Хүргэлт" },
        ].map((s) => (
          <div key={s.label} className="text-center p-6 bg-gray-900 rounded-xl">
            <div className="text-4xl font-bold text-orange-500">{s.num}</div>
            <div className="text-gray-400 mt-2">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">Хэвлэлийн төрлүүд</h2>
        <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { name: "Офсет хэвлэл", desc: "Визит, брошур, флаер", icon: "🖨️" },
            { name: "Дижитал хэвлэл", desc: "Постер, баннер, стикер", icon: "💻" },
            { name: "Өргөн форматын", desc: "Баннер, роллап, наалт", icon: "📐" },
            { name: "Ном, сэтгүүл", desc: "Каталог, тайлан, ном", icon: "📚" },
            { name: "Савлагаа", desc: "Хайрцаг, уут, шошго", icon: "📦" },
            { name: "Промо бараа", desc: "Цамц, аяга, бэлэг", icon: "🎁" },
          ].map((c) => (
            <a href="/products" key={c.name}
              className="p-6 bg-gray-900 rounded-xl hover:bg-gray-800 hover:border hover:border-orange-500 transition-all">
              <div className="text-4xl mb-3">{c.icon}</div>
              <div className="font-semibold text-lg">{c.name}</div>
              <div className="text-gray-400 text-sm mt-1">{c.desc}</div>
            </a>
          ))}
        </div>
      </section>

    </main>
  )
}