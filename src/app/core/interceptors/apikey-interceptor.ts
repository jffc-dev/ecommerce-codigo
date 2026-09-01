import { HttpInterceptorFn } from '@angular/common/http';
import { SUPABASE_ANON_KEY } from '../config/supabase.config';

export const apikeyInterceptor: HttpInterceptorFn = (req, next) => {
  const newRequest = req.clone({
    setHeaders: {
      apikey: SUPABASE_ANON_KEY,
      datoInterno: "1"
    }
  })
  return next(newRequest);
};
