import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import * as types from '../../types';
import * as helpers from '../../helpers';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth.service';
import { ActivatedRoute } from '@angular/router';
import { Game } from '../game/game.component';

@Component({
  selector: 'app-view-game',
  standalone: true,
  imports: [CommonModule, Game],
  templateUrl: './view-game.component.html',
  styleUrl: './view-game.component.css',
})
export class ViewGameComponent {
  @ViewChild('gameElement') gameElement!: Game;
  players: types.Player[] = [];
  gameId: number | null = null;
  game: types.Game | null = null;
  boardStates: types.Board[] = [];

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    private route: ActivatedRoute,
  ) {
    this.route.paramMap.subscribe((params) => {
      const gameId = params.get('game_id');
      if (gameId) this.gameId = +gameId;
      else return;
    });
    if (this.auth.user) {
      this.initialize();
    }
  }

  async initialize() {
    if (!this.gameId) return;
    const { data, error } = await this.supabase
      .getSupabaseClient()
      .from('games')
      .select()
      .eq('id', this.gameId)
      .single();

    if (error) throw error;

    this.gameElement.isPlaying = true;
    this.gameElement.disabledUserInteraction = true;
    this.game = data;
    if (!this.game?.opponent) {
      this.gameElement.isAi = false;
      this.gameElement.players = this.gameElement.populatePlayers(2);
      this.gameElement.players[1].isAI = false;
    }
    helpers.initializeBoardVariant(
      this.game?.startpos as string,
      this.gameElement.players.length,
      this.gameElement.board,
      this.gameElement.players,
    );
    this.boardStates.push(structuredClone(this.gameElement.board));
  }

  isActiveButton(isRight: boolean): boolean {
    if (!this.gameElement || !this.game) return isRight;
    if (isRight) return this.game.moves.length > this.gameElement.turnCount;
    return 0 != this.gameElement.turnCount;
  }

  next() {
    if (!this.isActiveButton(true)) return;
    const move = this.game!.moves[this.gameElement.turnCount];
    this.gameElement.doMove(move.col, move.row, () => {
      this.boardStates.push(structuredClone(this.gameElement.board));
      console.log(this.boardStates)
    });
  }

  prev() {
    if (!this.isActiveButton(false)) return;
    this.gameElement.turnCount--;
    this.gameElement.board = this.boardStates[this.gameElement.turnCount];
    console.log(this.gameElement.board)
  }
}
