/**
 * API Configuration Service
 * Provides environment-specific API endpoints based on build mode
 */

// The environment is determined at build time by Vite
const ENV = import.meta.env.VITE_APP_ENV || 'development';

// Configuration for different environments
const CONFIG = {
  development: {
    baseUrl: 'http://localhost:3000',
    apiPrefix: '/api/notion'
  },
  production: {
    baseUrl: 'https://canvastonotion.netlify.app/.netlify/functions',
    apiPrefix: '/notion'
  }
};

// Get the current environment configuration
const currentConfig = CONFIG[ENV as keyof typeof CONFIG] || CONFIG.development;

// Environment detection helpers
export const isDevelopment = ENV === 'development';
export const isProduction = ENV === 'production';

// Base URL for API calls
export const API_BASE_URL = currentConfig.baseUrl;

// API prefix for endpoints
export const API_PREFIX = currentConfig.apiPrefix;

// Helper to construct full API endpoints
export const getApiEndpoint = (endpoint: string): string => {
  // Ensure endpoint starts with a slash if not already
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${API_PREFIX}${normalizedEndpoint}`;
};

// Common endpoints
export const ENDPOINTS = {
  SYNC: getApiEndpoint('/sync'),
  COMPARE: getApiEndpoint('/compare'),
  CONNECTED: getApiEndpoint('/connected'),
  PAGES: getApiEndpoint('/pages')
};

// Log configuration in development
if (isDevelopment) {
  console.log('API Configuration:', {
    environment: ENV,
    baseUrl: API_BASE_URL,
    apiPrefix: API_PREFIX
  });
} 