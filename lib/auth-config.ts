/**
 * Centralized authentication configuration
 * Follows singleton pattern for consistent access across all auth flows
 * Environment-agnostic and edge-runtime compatible
 */

class AuthConfig {
  private static instance: AuthConfig | null = null;
  
  public readonly jwtSecret: string;
  public readonly appUrl: string;
  public readonly isProduction: boolean;
  public readonly nodeEnv: string;

  private constructor() {
    this.nodeEnv = process.env.NODE_ENV || 'development';
    this.isProduction = this.nodeEnv === 'production';
    
    // JWT Secret with intelligent fallbacks
    this.jwtSecret = this.getJwtSecret();
    
    // App URL with smart fallbacks based on environment
    this.appUrl = this.getAppUrl();
    
    // Validate configuration in production only
    if (this.isProduction) {
      this.validateProductionConfig();
    }
  }

  /**
   * Get JWT secret with fallbacks
   * Never fails during build time
   */
  private getJwtSecret(): string {
    // Primary source
    if (process.env.JWT_SECRET) {
      return process.env.JWT_SECRET;
    }
    
    // Fallback for edge runtime compatibility
    if (process.env.NEXT_PUBLIC_JWT_SECRET) {
      console.warn('⚠️ Using NEXT_PUBLIC_JWT_SECRET - consider using JWT_SECRET instead');
      return process.env.NEXT_PUBLIC_JWT_SECRET;
    }
    
    // Development fallback (NEVER in production)
    if (!this.isProduction) {
      console.warn('⚠️ No JWT_SECRET found, using development fallback');
      return 'dev-secret-change-in-production-replace-with-real-secret';
    }
    
    // Production without secret is a configuration error
    return '';
  }

  /**
   * Get application URL with smart fallbacks
   */
  private getAppUrl(): string {
    // Primary source
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    
    // Production fallback
    if (this.isProduction) {
      return 'https://thequietherapy.live';
    }
    
    // Development fallback
    return 'http://localhost:3000';
  }

  /**
   * Validate production configuration
   * Throws errors in production if misconfigured
   */
  private validateProductionConfig(): void {
    if (!this.jwtSecret || this.jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET must be set and at least 32 characters in production. ' +
        'Set JWT_SECRET in Netlify environment variables.'
      );
    }

    if (this.appUrl.includes('localhost')) {
      console.warn('⚠️ Production app URL includes localhost - check NEXT_PUBLIC_APP_URL');
    }
  }

  /**
   * Runtime validation helper
   * Use this in functions that need JWT secret
   */
  public validateSecret(): void {
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }
  }

  /**
   * Get singleton instance
   * Thread-safe and edge-runtime compatible
   */
  public static getInstance(): AuthConfig {
    if (!AuthConfig.instance) {
      AuthConfig.instance = new AuthConfig();
    }
    return AuthConfig.instance;
  }

  /**
   * Reset instance (useful for testing)
   */
  public static resetInstance(): void {
    AuthConfig.instance = null;
  }

  /**
   * Debug info (safe to log)
   */
  public getDebugInfo() {
    return {
      isProduction: this.isProduction,
      nodeEnv: this.nodeEnv,
      appUrl: this.appUrl,
      hasJwtSecret: !!this.jwtSecret,
      jwtSecretLength: this.jwtSecret?.length || 0,
    };
  }
}

// Export singleton instance
export const authConfig = AuthConfig.getInstance();

// Export class for testing
export { AuthConfig };

