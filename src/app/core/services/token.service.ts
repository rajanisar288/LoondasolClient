import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly ACCESS_TOKEN_KEY = 'workivlab_access_token';
  private readonly REFRESH_TOKEN_KEY = 'workivlab_refresh_token';
  private readonly REGION_KEY = 'workivlab_region_hint';

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  getRegionHint(): string | null {
    return localStorage.getItem(this.REGION_KEY);
  }

  setRegionHint(region: string): void {
    localStorage.setItem(this.REGION_KEY, region);
  }

  saveSession(accessToken: string, refreshToken: string, regionHint?: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
    if (regionHint) {
      this.setRegionHint(regionHint);
    }
  }

  clearSession(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}
