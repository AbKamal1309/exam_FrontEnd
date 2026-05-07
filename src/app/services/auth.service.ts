import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { UserDTO } from '../models/models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserDTO | null>(
    JSON.parse(localStorage.getItem('currentUser') || 'null')
  );
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private api: ApiService) {}

  get currentUser(): UserDTO | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<UserDTO> {
    return this.api.login({ name: '', email, password }).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  register(user: UserDTO): Observable<UserDTO> {
    return this.api.saveUser(user).pipe(
      tap(newUser => {
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        this.currentUserSubject.next(newUser);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }
}
