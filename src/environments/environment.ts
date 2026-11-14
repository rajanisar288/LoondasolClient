// Development environment configuration for Loondasol Workspace
export const environment = {
  production: false,
  isDevelopment: true,
  marketingUrl: 'http://localhost:3000',
  workspaceUrl: 'http://localhost:4200',
  apiUrl:
    (typeof window !== 'undefined' && (window as any).__ENV__?.API_URL) ||
    'http://localhost:4000/api/v1',
  socketUrl:
    (typeof window !== 'undefined' && (window as any).__ENV__?.SOCKET_URL) ||
    'http://localhost:4000',
};
