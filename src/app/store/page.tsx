"use client";

import React, { useEffect, useMemo, useState } from "react";

const DEFAULT_LAUNCH_DAYS = 21;

function getLaunchDays() {
  const raw = Number(process.env.NEXT_PUBLIC_STORE_LAUNCH_DAYS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_LAUNCH_DAYS;
}

function getStartKey() {
  return "scouff_store_launch_start";
}

export default function StorePage() {
  const [now, setNow] = useState(Date.now());
  const [start, setStart] = useState<number | null>(null);

  useEffect(() => {
    const key = getStartKey();
    const existing = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (existing && !Number.isNaN(Number(existing))) {
      setStart(Number(existing));
    } else {
      const next = Date.now();
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, String(next));
      }
      setStart(next);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const launchAt = useMemo(() => {
    if (!start) return null;
    return start + getLaunchDays() * 24 * 60 * 60 * 1000;
  }, [start]);

  if (!launchAt) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center text-blue-200">
        Loading store...
      </div>
    );
  }

  const diff = launchAt - now;
  const isLive = diff <= 0;

  if (isLive) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center px-6">
        <div className="max-w-3xl w-full">
          <h1 className="text-4xl font-bold text-neon-blue mb-4">SCOUFF Store</h1>
          <p className="text-blue-200 mb-8">Explore limited releases, curated lots, and private drops.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#131c2e] border border-blue-900 rounded-lg p-6 text-white">
              <div className="text-blue-300 text-sm mb-2">Featured Drop</div>
              <div className="text-xl font-semibold">Founder Collection</div>
            </div>
            <div className="bg-[#131c2e] border border-blue-900 rounded-lg p-6 text-white">
              <div className="text-blue-300 text-sm mb-2">Latest</div>
              <div className="text-xl font-semibold">New Arrivals</div>
            </div>
            <div className="bg-[#131c2e] border border-blue-900 rounded-lg p-6 text-white">
              <div className="text-blue-300 text-sm mb-2">Members Only</div>
              <div className="text-xl font-semibold">Private Vault</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center px-6">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl font-bold text-neon-blue mb-4">SCOUFF Store</h1>
        <p className="text-blue-200 mb-8">The store opens soon. Get notified when the vault unlocks.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#131c2e] border border-blue-900 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{days}</div>
            <div className="text-blue-300 text-xs uppercase tracking-widest">Days</div>
          </div>
          <div className="bg-[#131c2e] border border-blue-900 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{hours}</div>
            <div className="text-blue-300 text-xs uppercase tracking-widest">Hours</div>
          </div>
          <div className="bg-[#131c2e] border border-blue-900 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{minutes}</div>
            <div className="text-blue-300 text-xs uppercase tracking-widest">Minutes</div>
          </div>
          <div className="bg-[#131c2e] border border-blue-900 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{seconds}</div>
            <div className="text-blue-300 text-xs uppercase tracking-widest">Seconds</div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-center gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full md:w-80 px-4 py-3 rounded bg-[#101a2b] border border-blue-800 text-white"
          />
          <button className="px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            Notify Me
          </button>
        </div>
      </div>
    </div>
  );
}
