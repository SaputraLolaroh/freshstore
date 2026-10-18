'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function useCart() {
  return useContext(CartContext);
}

export default function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem('freshstore-cart') || '[]'));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('freshstore-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product) =>
    setItems((prev) => {
      const found = prev.find((i) => i.id === product.id);
      return found
        ? prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
        : [...prev, { id: product.id, name: product.name, price: product.price, image_url: product.image_url, unit: product.unit, qty: 1 }];
    });

  const setQty = (id, qty) => {
    if (qty < 1) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clearCart = () => setItems([]);

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const total = useMemo(() => items.reduce((s, i) => s + i.qty * Number(i.price), 0), [items]);

  return (
    <CartContext.Provider value={{ items, count, total, addItem, setQty, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}
