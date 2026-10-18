import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ProductCard from '@/components/ProductCard';

const PAGE_SIZE = 12;

// Beranda: hero, kategori, produk unggulan, katalog lengkap + filter/pencarian/sort/pagination
export default async function Home({ searchParams }) {
  const supabase = createClient();
  const q = searchParams.q || '';
  const category = searchParams.category || '';
  const sort = searchParams.sort || 'terbaru';
  const page = Math.max(1, Number(searchParams.page) || 1);

  const { data: categories } = await supabase.from('categories').select('*').order('name');

  let query = supabase.from('products').select('*', { count: 'exact' });
  if (q) query = query.ilike('name', `%${q}%`);
  if (category) query = query.eq('category_id', category);
  if (sort === 'termurah') query = query.order('price', { ascending: true });
  else if (sort === 'termahal') query = query.order('price', { ascending: false });
  else query = query.order('created_at', { ascending: false });
  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data: products, count } = await query;
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  const { data: featured } = await supabase
    .from('products')
    .select('*')
    .eq('is_featured', true)
    .limit(4);

  const buildUrl = (p) => {
    const params = new URLSearchParams({ ...searchParams, ...p });
    return `/?${params.toString()}`;
  };

  return (
    <div>
      {/* HERO — hijau ala fresh market */}
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-14 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              Belanja Segar, <span className="text-brand-100">Diantar ke Rumah</span>
            </h1>
            <p className="mt-3 text-brand-100">
              Sayur, buah, daging, dan sembako pilihan — segar setiap hari dengan harga pasar.
            </p>
            <form action="/" className="mt-6 flex max-w-md">
              <input
                type="text"
                name="q"
                placeholder="Cari kebutuhan hari ini…"
                className="flex-1 rounded-l-full px-4 py-3 text-sm text-gray-800 focus:outline-none"
              />
              <button className="bg-white text-brand-700 font-semibold px-6 rounded-r-full text-sm hover:bg-brand-50">
                Cari
              </button>
            </form>
          </div>
          <Image
            src="https://picsum.photos/seed/freshmarket/500/350"
            alt="Sayur segar"
            width={500}
            height={350}
            className="rounded-2xl shadow-xl hidden md:block"
            priority
          />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* KATEGORI */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          <Link
            href="/"
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border ${
              !category ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 hover:border-brand-500'
            }`}
          >
            Semua
          </Link>
          {(categories || []).map((c) => (
            <Link
              key={c.id}
              href={buildUrl({ category: String(c.id), page: '1' })}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border ${
                String(c.id) === String(category)
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 hover:border-brand-500'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* PRODUK UNGGULAN */}
        {featured?.length > 0 && !q && !category && page === 1 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-brand-800 mb-4">Produk Unggulan 🌿</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* KATALOG + FILTER */}
        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-bold text-brand-800">
              {q ? `Hasil pencarian "${q}"` : 'Semua Produk'}
              <span className="text-sm font-normal text-gray-400 ml-2">({count || 0})</span>
            </h2>
            <form action="/" className="flex gap-2">
              {q && <input type="hidden" name="q" value={q} />}
              {category && <input type="hidden" name="category" value={category} />}
              <select name="sort" defaultValue={sort} className="border rounded-full px-3 py-2 text-sm bg-white">
                <option value="terbaru">Terbaru</option>
                <option value="termurah">Termurah</option>
                <option value="termahal">Termahal</option>
              </select>
              <button className="bg-brand-600 text-white px-4 py-2 rounded-full text-sm hover:bg-brand-700">
                Urutkan
              </button>
            </form>
          </div>

          {!products?.length ? (
            <p className="text-gray-400 py-16 text-center">Produk tidak ditemukan.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2 text-sm">
              {page > 1 && (
                <Link href={buildUrl({ page: String(page - 1) })} className="px-4 py-2 border rounded-full bg-white hover:border-brand-500">
                  ← Sebelumnya
                </Link>
              )}
              <span className="px-4 py-2 text-gray-500">
                Hal {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link href={buildUrl({ page: String(page + 1) })} className="px-4 py-2 border rounded-full bg-white hover:border-brand-500">
                  Berikutnya →
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
