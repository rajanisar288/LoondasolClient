// Production environment configuration for Loondasol Workspace
export const environment = {
  production: true,
  isDevelopment: false,
  marketingUrl: 'https://www.loondasol.com',
  workspaceUrl: 'https://workspace.loondasol.com',
  apiUrl:
    (typeof window !== 'undefined' && (window as any).__ENV__?.API_URL) ||
    'https://api.loondasol.com/api/v1',
  socketUrl:
    (typeof window !== 'undefined' && (window as any).__ENV__?.SOCKET_URL) ||
    'https://api.loondasol.com',
};
