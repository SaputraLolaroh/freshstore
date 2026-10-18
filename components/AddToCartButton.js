'use client';

import { useState } from 'react';
import { useCart } from '@/components/CartProvider';

export default function AddToCartButton({ product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      onClick={handleClick}
      disabled={product.stock <= 0}
      className="w-full sm:w-auto bg-brand-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-700 disabled:bg-gray-300 transition"
    >
      {product.stock <= 0 ? 'Stok Habis' : added ? '✓ Ditambahkan' : '+ Tambah ke Keranjang'}
    </button>
  );
}
