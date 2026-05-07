import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LangService } from '../../services/lang.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = ''; password = ''; loading = false; error = '';
  constructor(private auth: AuthService, public lang: LangService, private router: Router) {}
  onSubmit() {
    this.loading = true; this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => { this.error = this.lang.t('login.error'); this.loading = false; }
    });
  }
}
