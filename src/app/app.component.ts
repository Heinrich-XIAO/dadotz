import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Game } from '../app/game/game.component';
import { AuthService } from './auth.service';
import { User } from '@supabase/supabase-js';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Game, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'dadotz-angular';
  userData: User | undefined;

  constructor(private auth: AuthService, private router: Router) {
    this.auth.currentUser.subscribe(user => {
      console.log(user)
      if (user == null) return;
      this.userData = user;
    })
  }

  signOut() {
    this.auth.signOut();
    this.router.navigate(['/']);
  }
}
