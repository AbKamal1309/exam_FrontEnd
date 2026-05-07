import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LangService } from '../../services/lang.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['../login/login.component.css']
})
export class RegisterComponent {
  name = ''; email = ''; password = ''; loading = false; error = '';
  constructor(private auth: AuthService, public lang: LangService, private router: Router) {}
  onSubmit() {
    this.loading = true; this.error = '';
    this.auth.register({ name: this.name, email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => { this.error = this.lang.t('register.error'); this.loading = false; }
    });
  }
}
