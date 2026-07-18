import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, switchMap, throwError, catchError } from 'rxjs';
import { UserDTO } from '../models/models';
import { ApiService, AuthResponse } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserDTO | null>(
      JSON.parse(localStorage.getItem('currentUser') || 'null')
  );
  currentUser$ = this.currentUserSubject.asObservable();

  private accessToken: string | null = localStorage.getItem('accessToken');
  private refreshTokenValue: string | null = localStorage.getItem('refreshToken');

  constructor(private api: ApiService) {}

  get currentUser(): UserDTO | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUserSubject.value && !!this.accessToken;
  }

  getCurrentUserId(): number {
    return this.currentUser?.id ?? 0;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshTokenValue;
  }

  /**
   * Décode les rôles embarqués dans l'access token (claim "roles", ajouté par JwtService
   * côté backend). Pas d'appel réseau : lecture locale du JWT, aucune vérification de
   * signature nécessaire ici puisque c'est uniquement pour l'affichage/la navigation —
   * toute action sensible reste vérifiée côté serveur (@PreAuthorize).
   */
  private decodeRoles(token: string): string[] {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return payload.roles || [];
    } catch {
      return [];
    }
  }

  get isAdmin(): boolean {
    if (!this.accessToken) return false;
    return this.decodeRoles(this.accessToken).includes('ROLE_ADMIN');
  }

  private setSession(auth: AuthResponse): void {
    this.accessToken = auth.accessToken;
    this.refreshTokenValue = auth.refreshToken;
    localStorage.setItem('currentUser', JSON.stringify(auth.user));
    localStorage.setItem('accessToken', auth.accessToken);
    localStorage.setItem('refreshToken', auth.refreshToken);
    this.currentUserSubject.next(auth.user);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.api.authLogin({ email, password }).pipe(
        tap(auth => this.setSession(auth))
    );
  }

  /**
   * Connexion Google : on transmet le id_token BRUT (response.credential côté Google Identity
   * Services) au backend, qui le vérifie lui-même (signature + audience) avant de faire confiance
   * à l'email. On ne décode/ne fait jamais confiance à un email décodé côté client.
   */
  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.api.googleAuthLogin(idToken).pipe(
        tap(auth => this.setSession(auth))
    );
  }

  /** Inscription (POST /users, public) puis connexion automatique pour récupérer les tokens. */
  register(user: UserDTO): Observable<AuthResponse> {
    return this.api.saveUser(user).pipe(
        switchMap(() => this.login(user.email!, user.password!))
    );
  }

  refreshAccessToken(): Observable<AuthResponse> {
    const refreshToken = this.refreshTokenValue;
    if (!refreshToken) {
      return throwError(() => new Error('Aucun refresh token disponible'));
    }
    return this.api.refreshToken(refreshToken).pipe(
        tap(auth => this.setSession(auth)),
        catchError(err => {
          this.logout();
          return throwError(() => err);
        })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.accessToken = null;
    this.refreshTokenValue = null;
    this.currentUserSubject.next(null);
  }
}
