import { getPublicSupabaseEnv } from '@/lib/env';

export async function GET() {
  const env = getPublicSupabaseEnv();
  return Response.json({
    hasUrl: Boolean(env.url),
    hasAnon: Boolean(env.anonKey),
    urlPreview: env.url ? env.url.slice(0, 12) + '…' : '',
    anonPreview: env.anonKey ? env.anonKey.slice(0, 12) + '…' : '',
    nodeEnv: process.env.NODE_ENV || '',
  });
}
