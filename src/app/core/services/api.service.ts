import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly baseUrl = environment.apiUrl;

  private getHeaders(body?: unknown): HttpHeaders {
    let headers = new HttpHeaders();

    // Do not set Content-Type if body is FormData to let browser set multipart boundary
    if (!(body instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }

    const token = this.tokenService.getAccessToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const region = this.tokenService.getRegionHint();
    if (region) {
      headers = headers.set('X-Region', region);
    }

    return headers;
  }

  get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          httpParams = httpParams.set(key, String(val));
        }
      });
    }

    return this.http.get<T>(`${this.baseUrl}/${path}`, {
      headers: this.getHeaders(),
      params: httpParams,
    });
  }

  getText(path: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/${path}`, {
      headers: this.getHeaders(),
      responseType: 'text',
    });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${path}`, body, {
      headers: this.getHeaders(body),
    });
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${path}`, body, {
      headers: this.getHeaders(body),
    });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${path}`, {
      headers: this.getHeaders(),
    });
  }
}
