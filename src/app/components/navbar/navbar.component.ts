import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LangService } from '../../services/lang.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">

      <a routerLink="/" class="nav-brand">
        <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#2563eb"/>
              <stop offset="1" stop-color="#7c3aed"/>
            </linearGradient>
          </defs>
          <path d="M16 2L28.6 9V23L16 30L3.4 23V9L16 2Z" fill="url(#logoGrad)"/>
          <path d="M10 16.5L14 20.5L22 12" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ lang.lang() === 'ar' ? 'إمتحان' : 'Amtihan' }}</span>
      </a>

      <div class="nav-links" *ngIf="auth.isLoggedIn">
        <a routerLink="/dashboard" routerLinkActive="active">{{ lang.t('nav.dashboard') }}</a>
        <a routerLink="/exams" routerLinkActive="active">{{ lang.t('nav.exams') }}</a>
        <a routerLink="/groups" routerLinkActive="active">{{ lang.t('nav.groups') }}</a>
        <a routerLink="/admin" *ngIf="auth.isAdmin">🛡️ {{ lang.t('nav.admin') }}</a>
      </div>

      <div class="nav-right">

        <!-- Bouton langue : cycle fr → en → ar → fr..., affiche la langue courante -->
        <button class="btn-lang" (click)="lang.toggle()" title="Change language">
          <span class="lang-label">{{ lang.lang().toUpperCase() }}</span>
        </button>

        <!-- Non connecté -->
        <ng-container *ngIf="!auth.isLoggedIn">
          <a routerLink="/login" class="btn-login">
            <span>👤</span> {{ lang.t('nav.login') }}
          </a>
        </ng-container>

        <!-- Connecté -->
        <ng-container *ngIf="auth.isLoggedIn">
          <div class="user-info">
            <div class="user-avatar">{{ userInitial }}</div>
            <span class="user-name">{{ auth.currentUser?.name }}</span>
          </div>
          <button class="btn-logout" (click)="logout()">{{ lang.t('nav.logout') }}</button>
        </ng-container>

      </div>
    </nav>
  `,
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  constructor(public auth: AuthService, public lang: LangService, private router: Router) {
    // Appliquer la direction au chargement
    document.documentElement.dir  = lang.isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang.lang();
  }

  get userInitial(): string { return this.auth.currentUser?.name?.charAt(0).toUpperCase() ?? '?'; }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}