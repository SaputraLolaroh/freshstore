'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { saveProductImage } from '@/lib/storage';

/* ================= AUTH (Supabase Auth) ================= */

export async function signUp(formData) {
  const supabase = createClient();
  const email = String(formData.get('email')).trim().toLowerCase();
  const password = String(formData.get('password'));
  const name = String(formData.get('name')).trim();

  if (password.length < 6) redirect('/login?error=Password minimal 6 karakter');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: undefined },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  if (data.user) {
    await supabase.from('profiles').upsert({ id: data.user.id, name, role: 'customer' });
  }
  redirect('/account');
}

export async function signIn(formData) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email')).trim().toLowerCase(),
    password: String(formData.get('password')),
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect('/');
}

export async function signOut() {
  await createClient().auth.signOut();
  redirect('/');
}

/* ================= GUARD ADMIN ================= */

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/');
  return supabase;
}

/* ================= KATEGORI ================= */

export async function addCategory(formData) {
  const supabase = await requireAdmin();
  const name = String(formData.get('name')).trim();
  if (!name) return;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  await supabase.from('categories').upsert({ name, slug }, { onConflict: 'slug' });
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function deleteCategory(formData) {
  const supabase = await requireAdmin();
  await supabase.from('categories').delete().eq('id', Number(formData.get('id')));
  revalidatePath('/');
  revalidatePath('/admin');
}

/* ================= PRODUK (dengan upload gambar) ================= */

export async function addProduct(formData) {
  const supabase = await requireAdmin();

  const file = formData.get('image');
  let image_url = String(formData.get('image_url') || '').trim() || null;
  // File di-upload lewat website → masuk ke Supabase Storage (atau storage lokal via STORAGE_DRIVER)
  if (file && file.size > 0) image_url = await saveProductImage(file);

  await supabase.from('products').insert({
    name: String(formData.get('name')).trim(),
    category_id: Number(formData.get('category_id')) || null,
    price: Number(formData.get('price')) || 0,
    unit: String(formData.get('unit') || 'pcs'),
    stock: Number(formData.get('stock')) || 0,
    description: String(formData.get('description') || ''),
    image_url,
    is_featured: formData.get('is_featured') === 'on',
  });
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function deleteProduct(formData) {
  const supabase = await requireAdmin();
  await supabase.from('products').delete().eq('id', Number(formData.get('id')));
  revalidatePath('/');
  revalidatePath('/admin');
}

/* ================= ORDER ================= */

export async function updateOrderStatus(formData) {
  const supabase = await requireAdmin();
  await supabase
    .from('orders')
    .update({ status: String(formData.get('status')) })
    .eq('id', Number(formData.get('id')));
  revalidatePath('/admin');
}

// Dipanggil dari halaman checkout (client) — harga SELALU dihitung ulang di server
export async function placeOrder({ items, customer }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!items?.length) return { error: 'Keranjang masih kosong' };
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('id', items.map((i) => i.id));

  const lines = [];
  for (const i of items) {
    const p = products?.find((x) => x.id === i.id);
    if (p) lines.push({ product_id: p.id, name: p.name, price: p.price, qty: i.qty, _stock: p.stock });
  }
  if (!lines.length) return { error: 'Produk tidak ditemukan' };

  const total = lines.reduce((s, l) => s + Number(l.price) * l.qty, 0);

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: user?.id ?? null,
      customer_name: customer.name,
      phone: customer.phone,
      address: customer.address,
      total,
      status: 'pending',
    })
    .select('id')
    .single();
  if (error) return { error: error.message };

  await supabase
    .from('order_items')
    .insert(lines.map(({ _stock, ...l }) => ({ ...l, order_id: order.id })));

  // Kurangi stok
  for (const l of lines) {
    await supabase
      .from('products')
      .update({ stock: Math.max(0, l._stock - l.qty) })
      .eq('id', l.product_id);
  }

  revalidatePath('/admin');
  return { ok: true, orderId: order.id };
}
