import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SupabaseService } from '../supabase.service';
import * as types from '../../types';
import { AuthService } from '../auth.service';
import { AuthUser } from '@supabase/supabase-js';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-view-past-games',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './view-past-games.component.html',
  styleUrl: './view-past-games.component.css',
})
export class ViewPastGamesComponent {
  games: types.Game[] = [];
  user: AuthUser | null | undefined;
  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
  ) {
    this.user = this.auth.user.getValue();
    if (this.auth.user) {
      this.getGames();
    }
  }

  async getGames() {
    if (!this.user) return;
    const { data, error } = await this.supabase
      .getSupabaseClient()
      .from('games')
      .select()
      .eq('player', this.user.id)
      .not('ended_at', 'is', null);

    if (error) throw error;

    const games = data as types.Game[];
    console.log(games);

    for (let i = 0; i < games.length; i++) {
      games[i].winner = games[i].moves[games[i].moves.length - 1].player.name;
      if (!games[i].opponent)
        games[i].winner = games[i].winner == 'blue' ? 'AI' : 'you';
      games[i].winner =
        (games[i].winner?.charAt(0).toUpperCase() as string) +
        games[i].winner?.slice(1);
    }

    this.games = games;
  }
}
