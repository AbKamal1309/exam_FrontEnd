import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');
  const isRegisterCall = req.method === 'POST' && req.url.endsWith('/users');

  const token = authService.getAccessToken();
  const authReq = (token && !isAuthEndpoint)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Ne pas tenter de refresh sur les endpoints d'auth eux-mêmes, ni sur l'inscription (publique)
        if (error.status === 401 && !isAuthEndpoint && !isRegisterCall) {
          return authService.refreshAccessToken().pipe(
              switchMap(auth => {
                const retryReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${auth.accessToken}` }
                });
                return next(retryReq);
              }),
              catchError(refreshError => {
                authService.logout();
                router.navigate(['/login']);
                return throwError(() => refreshError);
              })
          );
        }
        return throwError(() => error);
      })
  );
};
