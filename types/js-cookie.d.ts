declare module 'js-cookie' {
  export interface CookieAttributes {
    expires?: number | Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    httpOnly?: boolean;
  }

  export interface CookiesStatic {
    get(name: string): string | undefined;
    get(name: string, converter: (value: string) => string): string | undefined;
    get(name: string, converter: (value: string) => any): any;
    set(name: string, value: string, options?: CookieAttributes): string | undefined;
    remove(name: string, options?: CookieAttributes): void;
    withAttributes(attributes: CookieAttributes): CookiesStatic;
    withConverter(converter: {
      read: (value: string, name: string) => string;
      write: (value: string, name: string) => string;
    }): CookiesStatic;
  }

  const Cookies: CookiesStatic;
  export default Cookies;
}

