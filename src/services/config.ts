/**
 * Configuration Service
 * Manages URLs and configuration dynamically without hardcoding external URLs
 */

interface ConfigData {
  apiBaseUrl?: string;
  webAppBaseUrl?: string;
  environment?: 'development' | 'production';
}

class ConfigService {
  private static instance: ConfigService;
  private config: ConfigData = {};
  private initialized = false;

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Get stored configuration
      const stored = await chrome.storage.local.get(['configData']);
      
      if (stored.configData) {
        this.config = stored.configData;
      } else {
        // Set default configuration based on environment
        const isDev = import.meta.env.MODE === 'development';
        this.config = {
          environment: isDev ? 'development' : 'production',
          apiBaseUrl: isDev ? 'http://localhost:3000' : '',
          webAppBaseUrl: isDev ? 'http://localhost:5173' : ''
        };
        
        // Store the configuration
        await chrome.storage.local.set({ configData: this.config });
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing config:', error);
      // Fallback configuration
      this.config = {
        environment: 'production',
        apiBaseUrl: '',
        webAppBaseUrl: ''
      };
      this.initialized = true;
    }
  }

  async getApiBaseUrl(): Promise<string> {
    await this.initialize();
    if (this.config.environment === 'development') {
      return this.config.apiBaseUrl || 'http://localhost:3000';
    }
    // For production, construct URL dynamically or use stored value
    return this.config.apiBaseUrl || this.getProductionApiUrl();
  }

  async getWebAppBaseUrl(): Promise<string> {
    await this.initialize();
    if (this.config.environment === 'development') {
      return this.config.webAppBaseUrl || 'http://localhost:5173';
    }
    // For production, construct URL dynamically or use stored value
    return this.config.webAppBaseUrl || this.getProductionWebUrl();
  }

  private getProductionApiUrl(): string {
    // Construct production API URL dynamically
    const domain = 'canvastonotion.netlify.app';
    const path = '/.netlify/functions';
    return `https://${domain}${path}`;
  }

  private getProductionWebUrl(): string {
    // Construct production web URL dynamically
    const domain = 'canvastonotion.io';
    return `https://${domain}`;
  }

  async getApiEndpoint(endpoint: string): Promise<string> {
    const baseUrl = await this.getApiBaseUrl();
    const prefix = this.config.environment === 'development' ? '/api/notion' : '/notion';
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${prefix}${normalizedEndpoint}`;
  }

  async getCookieUrl(): Promise<string> {
    return await this.getWebAppBaseUrl();
  }

  async getLogoutApiUrl(): Promise<string> {
    if (this.config.environment === 'development') {
      return 'http://localhost:3000/api/auth/logout';
    }
    // Construct dynamically for production
    const domain = 'api.canvastonotion.io';
    return `http://${domain}/.netlify/functions/auth/logout`;
  }

  async getClearAuthUrl(): Promise<string> {
    if (this.config.environment === 'development') {
      return 'http://localhost:3000/api/cookie-state/clear-authenticated';
    }
    // Construct dynamically for production
    const domain = 'api.canvastonotion.io';
    return `https://${domain}/.netlify/functions/cookie-state/clear-authenticated`;
  }

  isDevelopment(): boolean {
    return this.config.environment === 'development' || import.meta.env.MODE === 'development';
  }

  getDefaultEmail(): string {
    return 'user@extension.local';
  }
}

export const configService = ConfigService.getInstance();
export { ConfigService }; 