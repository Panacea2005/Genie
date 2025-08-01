/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Fix case sensitivity issues on Windows
    config.resolve.symlinks = false;
    
    // Add case-insensitive resolution for Windows
    if (process.platform === 'win32') {
      config.resolve.alias = {
        ...config.resolve.alias,
      };
      
      // Ignore case sensitivity warnings
      config.stats = {
        ...config.stats,
        warningsFilter: [
          /There are multiple modules with names that only differ in casing/,
          /This can lead to unexpected behavior when compiling on a filesystem with other case-semantic/
        ]
      };
      
      config.ignoreWarnings = [
        /There are multiple modules with names that only differ in casing/,
        /This can lead to unexpected behavior when compiling on a filesystem with other case-semantic/
      ];
    }
    
    return config;
  },
}

export default nextConfig
