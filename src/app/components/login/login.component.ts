import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LangService } from '../../services/lang.service';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(
      private auth: AuthService,
      public lang: LangService,
      private router: Router
  ) {}

  ngOnInit() {
    this.initGoogleLogin();
  }

  initGoogleLogin() {
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.initialize({
        client_id: '744131153960-dg5pk850gjgdbj5dbu7255ql1kv7lvqr.apps.googleusercontent.com', // Remplacez par votre vrai Client ID
        callback: (response: any) => this.handleGoogleLogin(response)
      });

      google.accounts.id.renderButton(
          document.getElementById('googleBtn'),
          { theme: 'outline', size: 'large', width: '100%' }
      );
    }
  }

  /**
   * response.credential est le id_token SIGNÉ par Google. On l'envoie tel quel au backend,
   * qui le vérifie lui-même (signature + audience) avant de créer une session.
   * On ne décode plus rien côté client pour la décision d'authentification.
   */
  handleGoogleLogin(response: any) {
    this.loading = true;
    this.error = '';

    this.auth.googleLogin(response.credential).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Google login error:', err);
        this.error = 'Erreur lors de la connexion Google';
        this.loading = false;
      }
    });
  }

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.error = this.lang.t('login.error');
        this.loading = false;
      }
    });
  }
}
