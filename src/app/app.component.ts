import {Component, OnDestroy, OnInit} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import {SessionService} from "./services/session.service";
import {AuthService} from "./services/auth.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit ,OnDestroy  {

  constructor(
      private sessionService : SessionService,
      private authService : AuthService,
      private router: Router,
  ) {}

  ngOnInit() {
    // Démarrer la surveillance si l'utilisateur est connecté
    if (this.authService.isLoggedIn) {
      this.sessionService.startSessionMonitoring();
    }

    // Écouter les changements d'état de connexion
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.sessionService.startSessionMonitoring();
      } else {
        this.sessionService.stopSessionMonitoring();
        // Filet de sécurité : si la session devient nulle (déconnexion, refresh
        // échoué, timer d'inactivité...) pendant que l'utilisateur est sur une
        // page protégée, on force la redirection ici plutôt que de dépendre
        // uniquement du code qui a déclenché la déconnexion pour y penser.
        const publicRoutes = ['/', '/login', '/register'];
        if (!publicRoutes.includes(this.router.url)) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  ngOnDestroy() {
    this.sessionService.stopSessionMonitoring();
  }
}
