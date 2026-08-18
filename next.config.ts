import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: `${process.env.INTERNAL_API_URL ?? 'http://localhost:8082'}/:path*`,
      },
    ];
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Configuration des images
  images: {
    // Domaines autorisés pour les images externes
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8081',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      // ✅ Cloudinary pour les images uploadées
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      // ✅ AJOUT : Autoriser Unsplash pour les images par défaut (corrige l'erreur 500)
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // Ajoutez votre domaine de production ici plus tard
      // {
      //   protocol: 'https',
      //   hostname: 'api.carshare-burundi.com',
      //   pathname: '/**',
      // },
    ],
    
    // Formats d'image optimisés (WebP et AVIF pour de meilleures performances)
    formats: ['image/webp', 'image/avif'],
    
    // Qualités d'image pour l'optimisation
    qualities: [75, 90],
    
    // Tailles d'écran pour le responsive
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    // Tailles d'images pour l'optimisation
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Durée de cache minimale (en secondes)
    minimumCacheTTL: 60,
    
    // Autoriser les SVG (avec sécurité)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Mode strict de React pour détecter les problèmes
  reactStrictMode: true,
  
  // Configuration pour le mode production
  poweredByHeader: false,
  
  // Compression des assets
  compress: true,
};

export default withNextIntl(nextConfig);