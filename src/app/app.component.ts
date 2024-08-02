import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Game } from '../app/game/game.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Game],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'dadotz-angular';
}
