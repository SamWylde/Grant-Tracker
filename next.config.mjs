/** @type {import('next').NextConfig} */
const env = {};

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
} else if (process.env.SUPABASE_URL) {
  env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL;
}

if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
} else if (process.env.SUPABASE_ANON_KEY) {
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
}

const nextConfig = {
  reactStrictMode: true,
  experimental: {},
  env
};

export default nextConfig;
