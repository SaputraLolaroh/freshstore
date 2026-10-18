import './globals.css';
import Header from '@/components/Header';
import CartProvider from '@/components/CartProvider';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'FreshStore — Belanja Segar Setiap Hari',
  description: 'E-commerce kebutuhan segar: sayur, buah, daging, dan sembako.',
};

export default async function RootLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = data;
  }

  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-gray-50">
        <CartProvider>
          <Header user={user} profile={profile} />
          <main className="flex-1">{children}</main>
          <footer className="bg-brand-800 text-brand-100 mt-12">
            <div className="max-w-6xl mx-auto px-4 py-8 text-sm flex flex-col sm:flex-row justify-between gap-2">
              <p className="font-semibold text-white">FreshStore</p>
              <p>Segar setiap hari • Next.js + Supabase • Siap deploy ke Vercel</p>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
