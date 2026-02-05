import React from 'react';

export default function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block text-blue-200 mb-1 font-medium">{label}</span>
      {children}
    </label>
  );
}
