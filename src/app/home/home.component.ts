import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Game } from '../../app/game/game.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, Game],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  title = 'home';
}
