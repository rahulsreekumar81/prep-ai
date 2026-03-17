import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@prepai/shared', '@prepai/ui'],
}

export default nextConfig
