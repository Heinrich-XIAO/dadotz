import {
  Component,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth.service';
import * as types from '../../types';
import * as helpers from '../../helpers';
import mixpanel from 'mixpanel-browser';
import { AppComponent } from '../app.component';

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
  @ViewChild('chillScreen', { static: true })
  chillScreen!: ElementRef<HTMLDialogElement>;
  @ViewChild('gameSettings', { static: true })
  gameSettingsDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('boardElement', { static: true }) boardElement!: ElementRef;
  @ViewChildren('gridSpace') gridSpaces!: QueryList<ElementRef>;
  playerNames: string[] = ['red', 'blue', 'green', 'yellow'];
  playerColors: string[] = ['#f54e42', '#4287f5', '#32a852', '#fcba03'];
  isAi: boolean = false;
  boardWidth: number = 7;
  boardHeight: number = 7;
  isCustom: boolean = false;
  players: types.Player[] = [];
  aiDifficulty: number = 2;
  startPosition: string = 'pickaxe';
  board: types.Space[][] = Array.from(
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
  chillText: string = '';

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    private appComponent: AppComponent

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
    this.appComponent.content.nativeElement.style.backgroundColor = this.players[this.turnCount % this.players.length].color;
    helpers.initializeBoardVariant(
      this.startPosition,
      this.players.length,
      this.board,
      this.players,
    );
  }

  monitorFunction = (() => {
    let callTimestamps: number[] = [];

    return (fn: () => void) => {
      const currentTime = Date.now();
      callTimestamps.push(currentTime);

      if (callTimestamps.length > 5) {
        callTimestamps.shift();
      }

      if (callTimestamps.length >= 2) {
        const timeDifferences = callTimestamps.map((t, i, arr) =>
          i === 0 ? 0 : t - arr[i - 1]
        );
        const averageTimeBetweenCalls =
          timeDifferences.slice(1).reduce((a, b) => a + b, 0) /
          (timeDifferences.length - 1);

        if (averageTimeBetweenCalls < 500 && this.isAi) {
          this.chillScreen.nativeElement.showModal();
          this.chillScreen.nativeElement.focus();
          this.chillText = "Relax, this game is more strategic like a board game.";
        }
      }
      fn();
    };
  })();

  start(playerCount: number) {
    if (this.boardWidth > 15 || this.boardHeight > 15) {
      alert("board width/height cannot be more than 15 defaulting to 15");
      if (this.boardHeight > 15) this.boardHeight = 15;
      if (this.boardWidth  > 15) this.boardWidth = 15;
    }
    if (this.boardWidth < 7 || this.boardHeight < 7) {
      alert("board width/height cannot be less than 7 defaulting to 7");
      if (this.boardHeight < 7) this.boardHeight = 7;
      if (this.boardWidth  < 7) this.boardWidth = 7;
    }
    this.board = Array.from(
      { length: this.boardHeight },
      (_, row) => Array.from({ length: this.boardWidth }, (_, col) => ({
        col,
        row,
        value: 0,
      })),
    );
    if (playerCount == 1) {
      this.aiOptionsScreen.nativeElement.showModal();
      this.aiOptionsScreen.nativeElement.focus();
      this.isAi = true;
      this.players = this.populatePlayers(2);
      this.players[1].isAI = true;
    } else {
      this.players = this.populatePlayers(playerCount);
      this.isPlaying = true;
      this.appComponent.content.nativeElement.style.backgroundColor = this.players[this.turnCount % this.players.length].color;
    }
    helpers.initializeBoardVariant(
      this.startPosition,
      this.players.length,
      this.board,
      this.players,
    );

    // console.time('AI Search');
    // for (let i = 0; i < 500; i++) {
    //   helpers.minimax(this.board, 4, true, this.players[1], this.players[0], -Infinity, Infinity, this.aiDifficulty);
    // }
    // console.timeEnd('AI Search');
  }

  populatePlayers(playerCount: number): types.Player[] {
    return Array.from({ length: playerCount }, (_, index: number) => ({
      id: index,
      color: this.playerColors[index],
      name: this.playerNames[index],
      isAI: false,
    }));
  }

  async aiOptionsSubmit() {
    if (this.aiDifficulty < 1) this.aiDifficulty = 1;
    else if (this.aiDifficulty > 10) this.aiDifficulty = 10;

    this.aiOptionsScreen.nativeElement.close();

    await this.makeNewGame();
    this.isPlaying = true;
    this.appComponent.content.nativeElement.style.backgroundColor = this.players[this.turnCount % this.players.length].color;
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
    mixpanel.track('New Game', {
      'game_id': this.gameId
    });
  }

  async doMove(col: number, row: number, callback: ()=>void = ()=>{}){
    const initialValue = this.board[row][col].value;
    const currentPlayer = this.players[this.turnCount % this.players.length];
    if (this.isCustom && this.turnCount < this.players.length) {
      this.board[row][col].value = 3;
      this.board[row][col].player = currentPlayer;
    } else {
      if (!this.canGoYet) return;
      if (!this.board[row][col].player) return;
      if (this.board[row][col].value >= 4) return;
      if (currentPlayer.id == 1 && this.isAi) {
        this.chillText = "The AI is thinking...";
        this.chillScreen.nativeElement.showModal();
        this.chillScreen.nativeElement.focus();
        return;
      }
      if ((this.board[row][col].player.id != currentPlayer.id) && this.isAi) {
        this.chillText = "This is the AI's piece.";
        this.chillScreen.nativeElement.showModal();
        this.chillScreen.nativeElement.focus();
        return;
      }
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
        callback();
      },
      this,
    );
  }

  async pressed(col: number, row: number) {
    if (this.disabledUserInteraction) return;
    this.monitorFunction(() => this.doMove(col, row, () => {
      while (true) {
        if (helpers.getAllOfPlayer(this.board, this.players[this.turnCount % this.players.length]).length == 0) {
          this.turnCount++;
        } else {
          break;
        }
      }
      this.appComponent.content.nativeElement.style.backgroundColor = this.players[this.turnCount % this.players.length].color;
    }));
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
      mixpanel.track('Game Ended', {
        'status': player.id == 0 ? 'won' : 'lost',
        'game_id': this.gameId,
      });
    } else this.gameOverText = `${player.name.charAt(0).toUpperCase() + player.name.slice(1)} Won!`;
    this.appComponent.content.nativeElement.style.removeProperty('background-color');
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

  openSettings() {
    this.gameSettingsDialog.nativeElement.showModal();
  }
}
