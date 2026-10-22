// Production environment configuration
export const environment = {
  production: true,
  apiUrl: (typeof window !== 'undefined' && (window as any).__ENV__?.API_URL) || '/api/v1',
  socketUrl: (typeof window !== 'undefined' && (window as any).__ENV__?.SOCKET_URL) || '',
};
