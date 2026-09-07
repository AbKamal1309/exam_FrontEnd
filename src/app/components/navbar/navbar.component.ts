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
        <span class="brand-icon">⬡</span>
        <span>Amtihan</span>
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