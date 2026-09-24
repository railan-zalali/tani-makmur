'use client';

import React, { useState } from 'react';
import { Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface AdminAuthProps {
  onSuccess: (pin: string) => void;
}

export function AdminAuth({ onSuccess }: AdminAuthProps) {
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!pinInput.trim()) {
      setPinError('Masukkan PIN admin');
      return;
    }
    
    setLoading(true);
    setPinError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setPinError(body.error || 'PIN yang dimasukkan salah');
        return;
      }

      onSuccess(pinInput);
    } catch {
      setPinError('Terjadi kesalahan saat memvalidasi PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tani-950 via-tani-900 to-tani-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-tani-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Admin Panel</h1>
          <p className="text-sm text-emerald-200">Tani Makmur — Manajemen Produk</p>
        </div>
        <div className="space-y-3">
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Masukkan PIN Admin"
              disabled={loading}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50"
            />
            <button 
              type="button" 
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {pinError && <p className="text-red-300 text-xs">{pinError}</p>}
          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading ? 'Memvalidasi...' : 'Masuk ke Admin Panel'}
          </button>
        </div>
        <p className="text-center text-xs text-white/40">
          PIN diatur via env variable <code className="font-mono">ADMIN_PIN</code>
        </p>
      </div>
    </div>
  );
}
