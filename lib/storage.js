import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Lapisan abstraksi penyimpanan file.
 *
 * Default: 'supabase'  → file disimpan di Supabase Storage (bucket 'product-images').
 *          Cocok untuk deploy Vercel tanpa server lokal.
 *
 * Switch:  STORAGE_DRIVER=local → file disimpan di disk server (folder public/uploads).
 *          Cocok jika aplikasi dibeli & dijalankan on-premise di server perusahaan.
 *          Cukup ubah 1 env var — kode lain tidak perlu diubah sama sekali.
 */
const BUCKET = 'product-images';

export async function saveProductImage(file) {
  if (process.env.STORAGE_DRIVER === 'local') return saveToLocalDisk(file);
  return saveToSupabase(file);
}

async function saveToSupabase(file) {
  const supabase = createServiceClient();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const storagePath = `products/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Upload ke Supabase gagal: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function saveToLocalDisk(file) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const dir = process.env.LOCAL_UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/${filename}`;
}
