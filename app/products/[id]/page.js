import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProductCard, { rupiah } from '@/components/ProductCard';
import AddToCartButton from '@/components/AddToCartButton';

// Rute dinamis /products/[id] — detail produk + produk terkait
export default async function ProductDetail({ params }) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('id', params.id)
    .single();

  if (!product) notFound();

  const { data: related } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .limit(4);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <Image
          src={product.image_url || 'https://picsum.photos/seed/fresh/600/400'}
          alt={product.name}
          width={600}
          height={450}
          className="w-full h-80 object-cover rounded-2xl border border-gray-100"
          priority
        />
        <div>
          <p className="text-sm text-brand-600 font-semibold uppercase">
            {product.categories?.name || 'Umum'}
          </p>
          <h1 className="text-3xl font-bold mt-1 text-gray-900">{product.name}</h1>
          <p className="text-3xl font-bold text-brand-700 mt-4">
            {rupiah(product.price)}
            <span className="text-base font-normal text-gray-400"> / {product.unit || 'pcs'}</span>
          </p>
          <p className="text-gray-600 mt-4 leading-relaxed">{product.description}</p>
          <p className={`text-sm mt-3 font-medium ${product.stock > 0 ? 'text-brand-700' : 'text-red-500'}`}>
            {product.stock > 0 ? `Stok tersedia: ${product.stock} ${product.unit}` : 'Stok habis'}
          </p>
          <div className="mt-6">
            <AddToCartButton product={product} />
          </div>
          <div className="mt-6 text-xs text-gray-400 space-y-1">
            <p>✓ Dijamin segar atau uang kembali</p>
            <p>✓ Pengiriman same-day untuk pesanan sebelum 15.00</p>
          </div>
        </div>
      </div>

      {related?.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-brand-800 mb-4">Produk Terkait</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-8">
        <Link href="/" className="text-sm text-brand-700 hover:underline">
          ← Kembali berbelanja
        </Link>
      </p>
    </div>
  );
}
