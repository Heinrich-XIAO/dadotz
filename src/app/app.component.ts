import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Game } from '../app/game/game.component';
import { AuthService } from './auth.service';
import { User } from '@supabase/supabase-js';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Game, NgIf, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'dadotz';
  userData: User | undefined | null;

  ngAfterViewInit() {
    setTimeout(() => {
      this.userData = this.auth.user.getValue();
    }, 100)
  }

  constructor(private auth: AuthService, private router: Router) {
  }

  signOut() {
    this.auth.signOut();
    this.router.navigate(['/']);
    this.userData = null;
  }
}
