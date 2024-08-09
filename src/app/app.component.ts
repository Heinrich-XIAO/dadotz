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
  userData: User | undefined | null;

  ngAfterViewInit() {
    setTimeout(() => {
      this.userData = this.auth.user.getValue();
      console.log(this.userData)
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
