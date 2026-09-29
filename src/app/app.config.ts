import { ApplicationConfig, DEFAULT_CURRENCY_CODE, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import localeEsPe from '@angular/common/locales/es-PE';
import { routes } from './app.routes';
import { apikeyInterceptor } from './core/interceptors/apikey-interceptor';
import { testInterceptor } from './core/interceptors/test-interceptor';

// Precios en soles: el pipe currency muestra "S/ 10.00"
registerLocaleData(localeEsPe);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([apikeyInterceptor, testInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-PE' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'PEN' },
  ]
};
