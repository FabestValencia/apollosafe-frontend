import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router'; // Importación crucial
import { routes } from './app.routes'; // Tus rutas
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
// Update the import path if the file is located elsewhere, for example:
//import { usuarioInterceptor } from './interceptors/usuario.interceptor';
// Or, if the file does not exist, create 'usuario.interceptor.ts' in the correct folder.

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), // <- ASEGÚRATE DE QUE ESTO ESTÉ CORRECTO
    provideHttpClient(), // <-- AÑADIDO para que HttpClient funcione
    provideAnimationsAsync(),
    provideAnimationsAsync()
  ]
};
