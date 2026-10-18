import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { addProduct, deleteProduct, addCategory, deleteCategory, updateOrderStatus } from '@/lib/actions';

const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const inputCls =
  'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
const STATUS = ['pending', 'paid', 'shipped', 'done', 'cancelled'];

// Dashboard admin: statistik, kategori, produk (dengan upload foto), dan pesanan
export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/');

  const [{ count: productCount }, { count: orderCount }, { count: customerCount }, { data: orders }] =
    await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(10),
    ]);

  const revenue = (orders || []).reduce((s, o) => s + (o.status !== 'cancelled' ? Number(o.total) : 0), 0);
  const { data: categories } = await supabase.from('categories').select('*').order('name');
  const { data: products } = await supabase
    .from('products')
    .select('*, categories(name)')
    .order('created_at', { ascending: false });

  const stats = [
    { label: 'Produk', value: productCount ?? 0 },
    { label: 'Pesanan', value: orderCount ?? 0 },
    { label: 'Pelanggan', value: customerCount ?? 0 },
    { label: 'Pendapatan', value: rupiah(revenue) },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      <h1 className="text-2xl font-bold text-brand-800">Dashboard Admin</h1>

      {/* STATISTIK */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-400 uppercase">{s.label}</p>
            <p className="text-2xl font-bold text-brand-700 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* KATEGORI */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold mb-4">Kategori</h2>
        <form action={addCategory} className="flex gap-2 mb-4">
          <input name="name" placeholder="Nama kategori baru" required className={inputCls} />
          <button className="bg-brand-600 text-white px-5 rounded-xl text-sm hover:bg-brand-700 shrink-0">
            Tambah
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {(categories || []).map((c) => (
            <span key={c.id} className="flex items-center gap-2 bg-brand-50 text-brand-700 text-sm px-3 py-1.5 rounded-full">
              {c.name}
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={c.id} />
                <button className="text-red-400 hover:text-red-600">×</button>
              </form>
            </span>
          ))}
        </div>
      </section>

      {/* TAMBAH PRODUK + UPLOAD FOTO */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold mb-4">Tambah Produk</h2>
        <form action={addProduct} className="grid sm:grid-cols-2 gap-4">
          <input name="name" placeholder="Nama produk" required className={inputCls} />
          <select name="category_id" required className={inputCls}>
            <option value="">Pilih kategori…</option>
            {(categories || []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="price" type="number" placeholder="Harga (Rp)" required min="0" className={inputCls} />
          <div className="flex gap-2">
            <input name="stock" type="number" placeholder="Stok" min="0" className={inputCls} />
            <select name="unit" className={inputCls} defaultValue="pcs">
              <option>pcs</option><option>kg</option><option>pack</option><option>liter</option><option>ikat</option>
            </select>
          </div>
          <input name="image_url" type="url" placeholder="URL gambar (opsional)" className={inputCls} />
          <label className="flex items-center gap-2 text-sm text-gray-500 border border-dashed border-gray-300 rounded-xl px-3 py-2 cursor-pointer hover:border-brand-500">
            📷 Upload foto dari komputer
            <input name="image" type="file" accept="image/*" className="hidden" />
          </label>
          <textarea name="description" placeholder="Deskripsi produk" rows="2" className={`${inputCls} sm:col-span-2`} />
          <label className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
            <input name="is_featured" type="checkbox" className="accent-brand-600" /> Tampilkan sebagai produk unggulan
          </label>
          <button className="sm:col-span-2 bg-brand-600 text-white py-2.5 rounded-xl font-semibold hover:bg-brand-700">
            Simpan Produk
          </button>
        </form>
      </section>

      {/* DAFTAR PRODUK */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <h2 className="font-bold p-6 pb-2">Daftar Produk ({products?.length || 0})</h2>
        <table className="w-full text-sm mt-2">
          <thead className="bg-brand-50 text-left text-brand-800">
            <tr>
              <th className="px-6 py-3">Produk</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Harga</th>
              <th className="px-4 py-3">Stok</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(products || []).map((p) => (
              <tr key={p.id} className="border-t border-gray-50">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <Image src={p.image_url || 'https://picsum.photos/seed/fresh/100/100'} alt={p.name} width={40} height={40} className="w-10 h-10 rounded-lg object-cover" />
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{p.categories?.name || '-'}</td>
                <td className="px-4 py-3">{rupiah(p.price)} <span className="text-xs text-gray-400">/{p.unit}</span></td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-red-500 hover:underline">Hapus</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* PESANAN MASUK */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <h2 className="font-bold p-6 pb-2">Pesanan Terbaru</h2>
        <table className="w-full text-sm mt-2">
          <thead className="bg-brand-50 text-left text-brand-800">
            <tr>
              <th className="px-6 py-3">Order</th>
              <th className="px-4 py-3">Pelanggan</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(orders || []).map((o) => (
              <tr key={o.id} className="border-t border-gray-50">
                <td className="px-6 py-3 font-medium">#{o.id}</td>
                <td className="px-4 py-3">{o.customer_name}</td>
                <td className="px-4 py-3 text-gray-500">{o.order_items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</td>
                <td className="px-4 py-3 font-medium">{rupiah(o.total)}</td>
                <td className="px-4 py-3">
                  <form action={updateOrderStatus} className="flex gap-2">
                    <input type="hidden" name="id" value={o.id} />
                    <select name="status" defaultValue={o.status} className="border rounded-lg px-2 py-1 text-xs">
                      {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button className="text-brand-700 hover:underline text-xs">Ubah</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
