import { redirect } from 'next/navigation';

export default function EnvCheck() {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (missing.length === 0) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-gray-900 border border-blue-500 rounded-xl p-8 max-w-md w-full text-center shadow-lg">
        <h1 className="text-2xl font-bold text-blue-400 mb-4">Missing Supabase env vars</h1>
        <p className="text-gray-300 mb-2">The following environment variables are missing:</p>
        <ul className="mb-4">
          {missing.map((v) => (
            <li key={v} className="text-red-400 font-mono">{v}</li>
          ))}
        </ul>
        <p className="text-gray-400 mb-6">Set these in your <span className="font-mono">.env.local</span> file.</p>
        <a href="/login" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Back to Login</a>
      </div>
    </div>
  );
}
