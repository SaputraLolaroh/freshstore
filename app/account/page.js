import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const STATUS = {
  pending: 'Menunggu',
  paid: 'Dibayar',
  shipped: 'Dikirim',
  done: 'Selesai',
  cancelled: 'Dibatalkan',
};

// Akun pelanggan: profil + riwayat pesanan (dilindungi middleware)
export default async function AccountPage({ searchParams }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {searchParams.ordered === '1' && (
        <p className="bg-brand-50 text-brand-700 text-sm rounded-xl px-4 py-3 mb-6">
          🎉 Pesanan Anda berhasil dibuat! Kami akan segera memprosesnya.
        </p>
      )}

      <h1 className="text-2xl font-bold text-brand-800">Akun Saya</h1>
      <p className="text-gray-500 mt-1">{profile?.name || user.email}</p>

      <h2 className="font-bold mt-8 mb-4">Riwayat Pesanan</h2>
      {!orders?.length ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400 mb-3">Belum ada pesanan.</p>
          <Link href="/" className="text-brand-700 font-medium hover:underline">
            Mulai belanja →
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <div>
                  <p className="font-semibold">Order #{o.id}</p>
                  <p className="text-gray-400 text-xs">{new Date(o.created_at).toLocaleString('id-ID')}</p>
                </div>
                <span className="h-fit bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {STATUS[o.status] || o.status}
                </span>
              </div>
              <ul className="mt-3 text-sm text-gray-600 space-y-1">
                {o.order_items.map((it) => (
                  <li key={it.id} className="flex justify-between">
                    <span>{it.qty} × {it.name}</span>
                    <span>{rupiah(it.price * it.qty)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 pt-3 border-t text-right font-bold">
                Total: <span className="text-brand-700">{rupiah(o.total)}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
