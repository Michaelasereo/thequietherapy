/**
 * Centralized authentication configuration
 * Lazy-loading singleton pattern for edge-runtime compatibility
 * NEVER initializes at module load - only at runtime
 */

class AuthConfig {
  private static instance: AuthConfig | null = null;
  private _isInitialized = false;
  
  // Private mutable properties (initialized lazily)
  private _jwtSecret: string = '';
  private _appUrl: string = '';
  private _isProduction: boolean = false;
  private _nodeEnv: string = 'development';

  private constructor() {
    // Empty constructor - NO initialization here!
    // This prevents failures during Edge function bundling
  }

  /**
   * Lazy initialization - called only at runtime
   */
  private initialize(): void {
    if (this._isInitialized) return;

    this._nodeEnv = process.env.NODE_ENV || 'development';
    this._isProduction = this._nodeEnv === 'production';
    
    // JWT Secret with intelligent fallbacks
    this._jwtSecret = this.getJwtSecret();
    
    // App URL with smart fallbacks
    this._appUrl = this.getAppUrl();
    
    this._isInitialized = true;
    
    // Log warning in production if misconfigured (don't throw)
    if (this._isProduction && !this._jwtSecret) {
      console.error('❌ JWT_SECRET is required in production but not set');
    }
  }

  /**
   * Get JWT secret with fallbacks
   */
  private getJwtSecret(): string {
    // Primary source
    if (process.env.JWT_SECRET) {
      return process.env.JWT_SECRET;
    }
    
    // Development fallback (NEVER in production)
    if (process.env.NODE_ENV !== 'production') {
      return 'dev-secret-change-in-production-replace-with-real-secret';
    }
    
    // Production without secret - return empty (validation happens at runtime)
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
    if (process.env.NODE_ENV === 'production') {
      return 'https://thequietherapy.live';
    }
    
    // Development fallback
    return 'http://localhost:3000';
  }

  /**
   * Public getters - trigger lazy initialization
   */
  public get jwtSecret(): string {
    this.initialize();
    return this._jwtSecret;
  }

  public get appUrl(): string {
    this.initialize();
    return this._appUrl;
  }

  public get isProduction(): boolean {
    this.initialize();
    return this._isProduction;
  }

  public get nodeEnv(): string {
    this.initialize();
    return this._nodeEnv;
  }

  /**
   * Runtime validation helper
   * Use this in functions that need JWT secret
   */
  public validateSecret(): void {
    this.initialize(); // Ensure initialized
    if (!this._jwtSecret) {
      if (this._isProduction) {
        throw new Error('JWT_SECRET not configured');
      } else {
        console.warn('⚠️ JWT_SECRET not set in development');
      }
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
    this.initialize();
    return {
      isProduction: this._isProduction,
      nodeEnv: this._nodeEnv,
      appUrl: this._appUrl,
      hasJwtSecret: !!this._jwtSecret,
      jwtSecretLength: this._jwtSecret?.length || 0,
    };
  }
}

// Export singleton instance WITHOUT triggering initialization
export const authConfig = AuthConfig.getInstance();

// Export class for testing
export { AuthConfig };
