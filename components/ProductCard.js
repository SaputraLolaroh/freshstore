import Image from 'next/image';
import Link from 'next/link';

export const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(n));

export default function ProductCard({ product }) {
  const out = product.stock <= 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-500 transition overflow-hidden"
    >
      <div className="relative">
        <Image
          src={product.image_url || 'https://picsum.photos/seed/fresh/600/400'}
          alt={product.name}
          width={600}
          height={400}
          className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
        />
        {out && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Habis
          </span>
        )}
        {product.is_featured && !out && (
          <span className="absolute top-2 left-2 bg-brand-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Unggulan
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 truncate group-hover:text-brand-700">
          {product.name}
        </h3>
        <p className="text-brand-700 font-bold mt-1">
          {rupiah(product.price)}
          <span className="text-xs font-normal text-gray-400"> / {product.unit || 'pcs'}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">Stok: {product.stock}</p>
      </div>
    </Link>
  );
}
