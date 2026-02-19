"use client";
import React, { useState } from 'react';

export default function AddProductForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, price: Number(price) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Create failed');
      setName('');
      setPrice('0');
      onCreated?.();
      location.reload();
    } catch (err: any) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2 items-center">
      <input placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 rounded bg-[#0b1220]" />
      <input placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} className="px-3 py-2 rounded bg-[#0b1220] w-28" />
      <button disabled={loading} className="px-3 py-2 bg-blue-700 rounded">Add</button>
      {error && <div className="text-red-400 ml-2">{error}</div>}
    </form>
  );
}
