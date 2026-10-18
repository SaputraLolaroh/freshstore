'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/CartProvider';
import { placeOrder } from '@/lib/actions';

const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function CartPage() {
  const { items, total, setQty, removeItem, clearCart } = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 px-4">
        <p className="text-4xl mb-4">🛒</p>
        <p className="text-gray-500 mb-4">Keranjang Anda masih kosong.</p>
        <Link href="/" className="text-brand-700 font-medium hover:underline">
          Mulai belanja →
        </Link>
      </div>
    );
  }

  function handleCheckout(e) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const res = await placeOrder({
        items: items.map(({ id, qty }) => ({ id, qty })),
        customer,
      });
      if (res?.error) setError(res.error);
      else {
        clearCart();
        router.push('/account?ordered=1');
      }
    });
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8">
      {/* Daftar item */}
      <div>
        <h1 className="text-2xl font-bold text-brand-800 mb-6">Keranjang Belanja</h1>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
              <Image
                src={item.image_url || 'https://picsum.photos/seed/fresh/200/200'}
                alt={item.name}
                width={80}
                height={80}
                className="w-16 h-16 object-cover rounded-xl"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                <p className="text-xs text-gray-400">{rupiah(item.price)} / {item.unit || 'pcs'}</p>
              </div>
              <input
                type="number"
                min="1"
                value={item.qty}
                onChange={(e) => setQty(item.id, Number(e.target.value))}
                className="w-14 border rounded-lg px-1 py-1 text-center text-sm"
              />
              <p className="w-24 text-right text-sm font-semibold">{rupiah(item.price * item.qty)}</p>
              <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 text-xs">
                Hapus
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-right text-lg font-bold">
          Total: <span className="text-brand-700">{rupiah(total)}</span>
        </p>
      </div>

      {/* Form checkout — nantinya tinggal sambungkan Stripe (materi Bab 10) */}
      <form onSubmit={handleCheckout} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4 h-fit">
        <h2 className="font-bold text-lg">Data Pengiriman & Pembayaran</h2>
        {error && <p className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">{error}</p>}
        <input required placeholder="Nama penerima" value={customer.name}
          onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className={inputCls} />
        <input required placeholder="No. HP / WhatsApp" value={customer.phone}
          onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className={inputCls} />
        <textarea required placeholder="Alamat lengkap pengiriman" rows="3" value={customer.address}
          onChange={(e) => setCustomer({ ...customer, address: e.target.value })} className={inputCls} />
        <p className="text-xs text-gray-400">
          Metode: Bayar di tempat (COD) / transfer. Integrasi Stripe/gateway dapat ditambahkan pada langkah berikutnya.
        </p>
        <button
          disabled={pending}
          className="w-full bg-brand-600 text-white py-3 rounded-full font-semibold hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? 'Memproses…' : `Buat Pesanan • ${rupiah(total)}`}
        </button>
      </form>
    </div>
  );
}
