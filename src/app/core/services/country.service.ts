import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CountryService {
  private readonly storageKey = 'country_code';
  private readonly defaultCountry = 'US';

  readonly countryCode = signal<string>(this.getInitialCountryCode());

  constructor() {
    this.detectCountry();
  }

  getCountryCode(): string {
    return this.countryCode() || this.getInitialCountryCode();
  }

  setCountryCode(code: string): void {
    if (!code || typeof code !== 'string') return;
    const clean = code.trim().toUpperCase().slice(0, 2);
    if (/^[A-Z]{2}$/.test(clean)) {
      try {
        localStorage.setItem(this.storageKey, clean);
      } catch {}
      this.countryCode.set(clean);
    }
  }

  async detectCountry(): Promise<string> {
    // 1. If already saved in localStorage, respect it
    const existing = this.getStoredCountryCode();
    if (existing) {
      this.countryCode.set(existing);
      return existing;
    }

    // 2. Try fetching from lightweight IP Geolocation API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch('https://api.country.is/', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data?.country && /^[A-Za-z]{2}$/.test(data.country)) {
          const code = data.country.toUpperCase();
          this.setCountryCode(code);
          return code;
        }
      }
    } catch {
      // Secondary fallback endpoint
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res2 = await fetch('https://ipapi.co/json/', {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2?.country_code && /^[A-Za-z]{2}$/.test(data2.country_code)) {
            const code = data2.country_code.toUpperCase();
            this.setCountryCode(code);
            return code;
          }
        }
      } catch {}
    }

    // 3. Fallback to Timezone / Locale heuristics
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const inferred = this.inferCountryFromTimezone(timezone);
    this.setCountryCode(inferred);
    return inferred;
  }

  private getInitialCountryCode(): string {
    return (
      this.getStoredCountryCode() ||
      this.inferCountryFromTimezone(
        Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      ) ||
      this.defaultCountry
    );
  }

  private getStoredCountryCode(): string | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored && /^[A-Za-z]{2}$/.test(stored.trim())) {
        return stored.trim().toUpperCase();
      }
    } catch {}
    return null;
  }

  private inferCountryFromTimezone(tz: string): string {
    if (!tz) return this.defaultCountry;
    const lower = tz.toLowerCase();
    if (
      lower.includes('calcutta') ||
      lower.includes('kolkata') ||
      lower.includes('delhi') ||
      lower.includes('mumbai')
    ) {
      return 'IN';
    }
    if (
      lower.includes('karachi') ||
      lower.includes('islamabad') ||
      lower.includes('lahore')
    ) {
      return 'PK';
    }
    if (lower.includes('dhaka')) {
      return 'BD';
    }
    if (lower.includes('london')) {
      return 'GB';
    }
    if (
      lower.includes('toronto') ||
      lower.includes('vancouver') ||
      lower.includes('montreal')
    ) {
      return 'CA';
    }
    if (lower.includes('sydney') || lower.includes('melbourne')) {
      return 'AU';
    }
    if (lower.includes('dubai')) {
      return 'AE';
    }
    if (
      lower.includes('new_york') ||
      lower.includes('chicago') ||
      lower.includes('los_angeles') ||
      lower.includes('denver') ||
      lower.includes('america')
    ) {
      return 'US';
    }
    return this.defaultCountry;
  }
}
