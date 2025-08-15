// Sentry configuration for Next.js
// This would be auto-configured by @sentry/nextjs, but simulated for development

const { withSentryConfig } = require('@sentry/nextjs') || { withSentryConfig: (config) => config }

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Existing configuration
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
  },
  
  // PWA configuration
  // (This would be added during Sprint 3)
  
  // Sentry configuration
  sentry: {
    // Suppress Sentry errors during build
    hideSourceMaps: false,
    // Disable the Sentry webpack plugin during development
    disableServerWebpackPlugin: process.env.NODE_ENV === 'development',
    disableClientWebpackPlugin: process.env.NODE_ENV === 'development',
  },
}

// Sentry webpack plugin configuration
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin
  org: process.env.SENTRY_ORG || 'spiread',
  project: process.env.SENTRY_PROJECT || 'spiread-app',
  
  // Authentication token for the Sentry CLI
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Release configuration
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Only upload source maps in production
  silent: process.env.NODE_ENV !== 'production',
  
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
}

// Only wrap with Sentry in production or when explicitly enabled
const shouldUseSentry = process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG === 'true'

module.exports = shouldUseSentry 
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig