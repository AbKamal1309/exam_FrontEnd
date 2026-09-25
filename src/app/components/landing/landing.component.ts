import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { LangService } from '../../services/lang.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  readonly playStoreUrl = 'https://play.google.com/store/apps/details?id=com.acoidemy.amtihan';
  playBadgeDismissed = false;

  private readonly PLAY_BADGE_KEY = 'amtihan_play_badge_dismissed';

  constructor(public lang: LangService) {}

  ngOnInit() {
    this.playBadgeDismissed = localStorage.getItem(this.PLAY_BADGE_KEY) === 'true';
  }

  get playBadgeImg(): string {
    const supported = ['en', 'fr', 'ar'];
    const code = supported.includes(this.lang.lang()) ? this.lang.lang() : 'en';
    return `https://play.google.com/intl/${code}_us/badges/static/images/badges/${code}_badge_web_generic.png`;
  }

  dismissPlayBadge(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.playBadgeDismissed = true;
    localStorage.setItem(this.PLAY_BADGE_KEY, 'true');
  }
}
