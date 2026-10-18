'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { signOut } from '@/lib/actions';

export default function Header({ user, profile }) {
  const { count } = useCart();
  const isAdmin = profile?.role === 'admin';

  return (
    <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="w-8 h-8 rounded-full bg-brand-600 text-white grid place-items-center font-bold">
            F
          </span>
          <span className="text-xl font-bold text-brand-700">FreshStore</span>
        </Link>

        <form action="/" className="flex-1 hidden sm:block">
          <input
            type="text"
            name="q"
            placeholder="Cari bayam, ayam, beras…"
            className="w-full max-w-md border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="text-gray-600 hover:text-brand-600 hidden sm:block">
            Beranda
          </Link>
          {isAdmin && (
            <Link href="/admin" className="text-gray-600 hover:text-brand-600">
              Admin
            </Link>
          )}
          {user && (
            <Link href="/account" className="text-gray-600 hover:text-brand-600 hidden sm:block">
              Akun
            </Link>
          )}
          <Link href="/cart" className="relative text-brand-700 hover:text-brand-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 4.6a1 1 0 00.9 1.4H19M9 22a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            {count > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-brand-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <form action={signOut}>
              <button type="submit" className="text-gray-400 hover:text-red-500">
                Keluar
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="bg-brand-600 text-white px-4 py-2 rounded-full hover:bg-brand-700"
            >
              Masuk
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
