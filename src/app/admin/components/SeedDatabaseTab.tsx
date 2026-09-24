import React, { useState } from 'react';
import { RefreshCw, Database, AlertTriangle } from 'lucide-react';

interface SeedDatabaseTabProps {
  pin: string;
  onSeedSuccess: () => void;
  flash: (msg: string, isError?: boolean) => void;
}

export function SeedDatabaseTab({ pin, onSeedSuccess, flash }: SeedDatabaseTabProps) {
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!confirm('Seed produk dari file JSON default ke database? Data lama akan digantikan.')) return;
    setSeeding(true);
    try {
      const { default: localProducts } = await import('@/data/products.json');
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify(localProducts),
      });
      if (!res.ok) {
        const body = await res.json();
        if (res.status === 401) throw new Error('PIN salah. Silakan logout dan login ulang.');
        throw new Error(body.error);
      }
      const { imported } = await res.json();
      flash(`${imported} produk berhasil di-seed ke database`);
      onSeedSuccess();
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Seed gagal', true);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="font-black text-xl text-stone-900">Inisiasi Database</h2>
        <p className="text-sm text-stone-500 mt-1">Gunakan tab ini untuk pertama kali setup atau reset database.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800 text-sm">Langkah setup pertama kali:</p>
            <ol className="text-xs text-amber-700 mt-2 space-y-1 list-decimal list-inside">
              <li>Buat database MySQL di cPanel &rarr; phpMyAdmin</li>
              <li>Import file <code className="font-mono bg-amber-100 px-1 rounded">schema.sql</code></li>
              <li>Set env: <code className="font-mono bg-amber-100 px-1 rounded">DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, ADMIN_PIN</code></li>
              <li>Jalankan <code className="font-mono bg-amber-100 px-1 rounded">npm run build</code></li>
              <li>Klik tombol Seed di bawah</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <div>
          <h3 className="font-bold text-stone-900">Seed Data Default</h3>
          <p className="text-sm text-stone-500 mt-1">
            Mengisi database dengan 16 produk dari <code className="font-mono text-xs bg-stone-100 px-1 rounded">products.json</code>. Data lama akan dihapus.
          </p>
        </div>
        <button onClick={handleSeed} disabled={seeding}
          className="flex items-center gap-2 bg-tani-700 hover:bg-tani-800 text-white font-bold px-6 py-3 rounded-xl text-sm disabled:opacity-60">
          {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          {seeding ? 'Menyimpan ke database...' : 'Seed Data Default ke Database'}
        </button>
      </div>
    </div>
  );
}
