// Production environment configuration for Loondasol Workspace
export const environment = {
  production: true,
  isDevelopment: false,
  marketingUrl: 'https://loondasol.com',
  workspaceUrl: 'https://workspace.loondasol.com',
  apiUrl: (typeof window !== 'undefined' && (window as any).__ENV__?.API_URL) || '/api/v1',
  socketUrl: (typeof window !== 'undefined' && (window as any).__ENV__?.SOCKET_URL) || '',
};
