import React from 'react';

export default function Card({ title, value, children }: { title: string; value?: string | number; children?: React.ReactNode }) {
  return (
    <div className="bg-[#131c2e] rounded-lg shadow-lg p-6 border border-blue-900 flex flex-col gap-2 min-w-[180px]">
      <div className="text-blue-400 text-xs uppercase tracking-widest">{title}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {children}
    </div>
  );
}
