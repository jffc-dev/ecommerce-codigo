import { HttpInterceptorFn } from '@angular/common/http';

export const testInterceptor: HttpInterceptorFn = (req, next) => {
  console.log(req)
  return next(req);
};
