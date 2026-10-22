// Development environment configuration
export const environment = {
  production: false,
  apiUrl:
    (typeof window !== 'undefined' && (window as any).__ENV__?.API_URL) ||
    'http://localhost:4000/api/v1',
  socketUrl:
    (typeof window !== 'undefined' && (window as any).__ENV__?.SOCKET_URL) ||
    'http://localhost:4000',
};
