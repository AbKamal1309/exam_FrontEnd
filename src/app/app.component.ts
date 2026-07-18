import {Component, OnDestroy, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
      }
    });
  }

  ngOnDestroy() {
    this.sessionService.stopSessionMonitoring();
  }
}
