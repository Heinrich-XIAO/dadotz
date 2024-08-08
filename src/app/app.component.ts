import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Game } from '../app/game/game.component';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Game],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'dadotz-angular';
  constructor(private auth: AuthService, private router: Router) {

  }

  signOut() {
    this.auth.signOut();
    this.router.navigate(['/']);
  }
}
