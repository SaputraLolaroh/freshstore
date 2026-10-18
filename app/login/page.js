import { signIn, signUp } from '@/lib/actions';

const inputCls =
  'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

export default function LoginPage({ searchParams }) {
  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brand-800">Selamat Datang</h1>
        <p className="text-gray-500 text-sm mt-1">Masuk atau buat akun FreshStore</p>
      </div>

      {searchParams.error && (
        <p className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{searchParams.error}</p>
      )}

      <form action={signIn} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
        <h2 className="font-semibold">Masuk</h2>
        <input type="email" name="email" placeholder="Email" required className={inputCls} />
        <input type="password" name="password" placeholder="Password" required className={inputCls} />
        <button className="w-full bg-brand-600 text-white py-2.5 rounded-full font-semibold hover:bg-brand-700">
          Masuk
        </button>
      </form>

      <form action={signUp} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
        <h2 className="font-semibold">Daftar Akun Baru</h2>
        <input type="text" name="name" placeholder="Nama lengkap" required className={inputCls} />
        <input type="email" name="email" placeholder="Email" required className={inputCls} />
        <input type="password" name="password" placeholder="Password (min. 6 karakter)" required minLength={6} className={inputCls} />
        <button className="w-full bg-brand-800 text-white py-2.5 rounded-full font-semibold hover:bg-brand-700">
          Daftar
        </button>
        <p className="text-xs text-gray-400 text-center">
          Tips: nonaktifkan "Confirm email" di Supabase Auth agar login langsung aktif saat development.
        </p>
      </form>
    </div>
  );
}
