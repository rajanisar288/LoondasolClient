import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Auto-recover from stale dynamic chunk hash errors after Vite/Angular rebuilds
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

window.addEventListener('unhandledrejection', (event) => {
  const msg = event?.reason?.message || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    event?.reason?.name === 'ChunkLoadError'
  ) {
    event.preventDefault();
    window.location.reload();
  }
});

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));

