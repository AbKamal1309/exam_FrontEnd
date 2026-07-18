import {Injectable} from "@angular/core";
import {Subscription, timer} from "rxjs";
import {take} from "rxjs/operators";
import {Router} from "@angular/router";
import {AuthService} from "./auth.service";
import Swal from "sweetalert2";

@Injectable({
    providedIn: "root",
})
export class SessionService  {

    private sessionTimeout = 30 * 60 * 1000; // 30 minutes en millisecondes
    private warningTimeout = 28 * 60 * 1000; // 28 minutes (2 min avant la fin)
    private timerSubscription: Subscription | null = null;
    private warningSubscription: Subscription | null = null;
    private isWarningShown = false

    constructor(
        private router: Router,
        private authService: AuthService,
    ) {
    }

    startSessionMonitoring() {
        this.resetTimer();
        this.setupActivityListeners();
    }

    stopSessionMonitoring() {
        this.clearTimers();
        this.removeActivityListeners();
    }

    private resetTimer() {
        this.clearTimers();
        this.isWarningShown = false;

        // Timer d'avertissement (2 minutes avant la fin)
        this.warningSubscription = timer(this.warningTimeout).pipe(take(1)).subscribe(() => {
            this.showWarning();
        });

        // Timer de déconnexion
        this.timerSubscription = timer(this.sessionTimeout).pipe(take(1)).subscribe(() => {
            this.logout();
        });
    }

    private showWarning() {
        if (!this.isWarningShown) {
            this.isWarningShown = true;
            Swal.fire({
                title: '⏳ Session bientôt expirée',
                text: 'Votre session va expirer dans 2 minutes. Voulez-vous rester connecté ?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Oui, rester connecté',
                cancelButtonText: 'Non, me déconnecter',
                timer: 120000, // 2 minutes
                timerProgressBar: true,
                didOpen: () => {
                    Swal.showLoading();
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    this.resetTimer();
                } else {
                    this.logout();
                }
            });
        }
    }

    private logout() {
        this.stopSessionMonitoring();
        this.authService.logout();
        this.router.navigate(['/login']);
        // Message informatif (optionnel)
        alert('⏱️ Votre session a expiré pour cause d\'inactivité.');
    }

    private clearTimers() {
        if (this.timerSubscription) {
            this.timerSubscription.unsubscribe();
            this.timerSubscription = null;
        }
        if (this.warningSubscription) {
            this.warningSubscription.unsubscribe();
            this.warningSubscription = null;
        }
    }

    private setupActivityListeners() {
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, this.onActivity.bind(this));
        });
    }

    private removeActivityListeners() {
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.removeEventListener(event, this.onActivity.bind(this));
        });
    }


    private onActivity() {
        if (this.authService.isLoggedIn) {
            this.resetTimer();
        }
    }


}