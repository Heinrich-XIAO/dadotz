import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Game } from '../app/game/game.component';
import { AuthService } from './auth.service';
import { User } from '@supabase/supabase-js';
import { NgIf } from '@angular/common';
import mixpanel from 'mixpanel-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Game, NgIf, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'dadotz';
  userData: User | undefined | null;

  ngAfterViewInit() {
    const checkUserData = () => {
      this.userData = this.auth.user.getValue();
      if (this.userData == null) {
        setTimeout(checkUserData, 100);
        return;
      }
      mixpanel.identify(this.userData.id);
      mixpanel.people.set({
        $email: this.userData.email,
        $name: this.userData.email,
        $created: this.userData.created_at,
      });
    };
    setTimeout(checkUserData, 100);
  }

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {
    mixpanel.init("6ea9d839a05fca9c94952d995a07022a", {
      debug: true,
      track_pageview: true,
      persistence: "localStorage",
    });
  }

  signOut() {
    this.auth.signOut();
    this.router.navigate(['/']);
    this.userData = null;
  }
}
