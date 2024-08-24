import {
  Component,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
  Pipe,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth.service';
import * as types from '../../types';
import * as helpers from '../../helpers';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class Game {
  @ViewChild('aiOptionsScreen', { static: true })
  aiOptionsScreen!: ElementRef<HTMLDialogElement>;
  @ViewChild('gameOverScreen', { static: true })
  gameOverScreen!: ElementRef<HTMLDialogElement>;
  @ViewChild('boardElement', { static: true }) boardElement!: ElementRef;
  @ViewChildren('gridSpace') gridSpaces!: QueryList<ElementRef>;
  playerNames: Array<string> = ['red', 'blue', 'green', 'yellow'];
  playerColors: Array<string> = ['#f54e42', '#4287f5', '#32a852', '#fcba03'];
  isAi: boolean = false;
  boardWidth: number = 7;
  boardHeight: number = 7;
  isCustom: boolean = false;
  players: types.Player[] = [];
  aiDifficulty: number = 2;
  startPosition: string = 'pickaxe';
  board: Array<Array<types.Space>> = Array.from(
    { length: this.boardHeight },
    (_, row) =>
      Array.from({ length: this.boardWidth }, (_, col) => ({
        col,
        row,
        value: 0,
      })),
  );
  boardElements: ElementRef[][] = [];
  isPlaying: boolean = false;
  turnCount: number = 0;
  gameOverText: string = '';
  gameId: number | null = null;
  canGoYet: boolean = true;
  help: boolean = true;
  disabledUserInteraction: boolean = false;

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
  ) {}

  ngAfterViewInit() {
    const elementsArray = this.gridSpaces.toArray();
    const rows = this.board.length;
    const cols = this.board[0].length;

    for (let i = 0; i < rows; i++) {
      this.boardElements[i] = [];
      for (let j = 0; j < cols; j++) {
        this.boardElements[i][j] = elementsArray[i * cols + j];
      }
    }
  }

  restart() {
    this.makeNewGame();
    this.board = Array.from({ length: this.boardHeight }, (_, row) =>
      Array.from({ length: this.boardWidth }, (_, col) => ({
        col,
        row,
        value: 0,
      })),
    );
    this.boardElements = [];
    this.isPlaying = true;
    this.turnCount = 0;
    this.gameOverText = '';
    this.gameOverScreen.nativeElement.close();
    helpers.initializeBoardVariant(
      this.startPosition,
      this.players.length,
      this.board,
      this.players,
    );
  }

  start(playerCount: number) {
    if (playerCount == 1) {
      this.aiOptionsScreen.nativeElement.showModal();
      this.aiOptionsScreen.nativeElement.focus();
      this.isAi = true;
      this.players = this.populatePlayers(2);
      this.players[1].isAI = true;
    } else {
      this.players = this.populatePlayers(playerCount);
      this.isPlaying = true;
    }
    helpers.initializeBoardVariant(
      this.startPosition,
      this.players.length,
      this.board,
      this.players,
    );
  }

  populatePlayers(playerCount: number): Array<types.Player> {
    return Array.from({ length: playerCount }, (_, index: number) => ({
      id: index,
      color: this.playerColors[index],
      name: this.playerNames[index],
      isAI: false,
    }));
  }

  async aiOptionsSubmit() {
    this.aiOptionsScreen.nativeElement.close();

    await this.makeNewGame();
    this.isPlaying = true;
  }

  async makeNewGame() {
    if (this.auth.user.getValue()) {
      const data: types.Game | null = (
        await this.supabase
          .getSupabaseClient()
          .from('games')
          .insert([
            {
              ai_difficulty: {
                difficulty: this.aiDifficulty,
              },
              moves: [],
              startpos: this.startPosition,
            },
          ])
          .select()
      ).data![0] as types.Game | null;
      if (data) this.gameId = data.id;
    } else {
      this.gameId = null;
    }
  }

  async doMove(col: number, row: number) {
    const initialValue = this.board[row][col].value;
    const currentPlayer = this.players[this.turnCount % this.players.length];
    if (this.isCustom && this.turnCount < this.players.length) {
      this.board[row][col].value = 3;
      this.board[row][col].player = currentPlayer;
    } else {
      if (!this.canGoYet) return;
      if (!this.board[row][col].player) return;
      if (this.board[row][col].value >= 4) return;
      if (currentPlayer.id == 1 && this.isAi) return;
      if (this.board[row][col].player.id != currentPlayer.id) return;
      if (this.board[row][col].value != 0) this.board[row][col].value++;
      else return;
    }
    this.addMove(col, row, initialValue);
    const cycles = helpers.calculateCycles(helpers.cloneBoard(this.board));
    this.canGoYet = false;
    helpers.renderCycles(
      cycles,
      () => {
        this.canGoYet = true;
        console.log('Player went');
      },
      this,
    );
  }

  async pressed(col: number, row: number) {
    if (this.disabledUserInteraction) return;
    this.doMove(col, row);
  }

  async addMove(col: number, row: number, value: number) {
    if (this.isAi && this.gameId && this.board[row][col].player) {
      const { data: game, error: fetchError } = await this.supabase
        .getSupabaseClient()
        .from('games')
        .select('moves')
        .eq('id', this.gameId)
        .single();

      const newMove: types.Move = {
        col,
        row,
        value: value,
        player: this.board[row][col].player,
      };
      const updatedMoves = [...(game?.moves || []), newMove];
      await this.supabase
        .getSupabaseClient()
        .from('games')
        .update({ moves: updatedMoves })
        .eq('id', this.gameId)
        .select();
    }
  }

  switchPlayer() {
    const hasWon = helpers.hasWon(this.board, this);
    if (hasWon) {
      this.gameOver(hasWon);
      return;
    }
    if (this.isAi && this.turnCount % 2 == 1) {
      setTimeout(() => {
        console.time('AI Search');
        const bestMoves = helpers.minimax(
          structuredClone(this.board),
          4,
          true,
          this.players[1],
          this.players[0],
          -Infinity,
          Infinity,
          this.aiDifficulty,
        );
        console.timeEnd('AI Search');

        const bestMove = bestMoves[1][0];
        console.log(bestMove);
        this.addMove(
          bestMove.col,
          bestMove.row,
          this.board[bestMove.row][bestMove.col].value,
        );
        this.board = helpers.increase(bestMove.col, bestMove.row, this.board);
        const cycles = helpers.calculateCycles(structuredClone(this.board));
        this.canGoYet = false;
        helpers.renderCycles(
          cycles,
          () => {
            console.log('ai went');
            this.canGoYet = true;
          },
          this,
          false,
        );
      }, 500);
    }
  }

  async gameOver(player: types.Player) {
    if (this.disabledUserInteraction) return;
    if (this.isAi) {
      if (player.id == 0) this.gameOverText = 'You Won!';
      else this.gameOverText = 'AI Won!';
    } else this.gameOverText = `${player.name} Won!`;
    this.gameOverScreen.nativeElement.showModal();

    if (this.isAi && this.gameId) {
      console.log('setting end time');
      await this.supabase
        .getSupabaseClient()
        .from('games')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', this.gameId)
        .select();
    }
  }

  toggleHelp() {
    this.help = !this.help;
  }

  evalBarWidth() {
    return helpers.evalBarWidth(this);
  }
}
