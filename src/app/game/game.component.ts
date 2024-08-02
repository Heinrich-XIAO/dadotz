import { Component, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Player {
  id: number;
  color: string;
  name: string;
}

interface Space {
  col: number;
  row: number;
  value: number;
  player?: Player;
}

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class Game {
  @ViewChild('aiOptionsScreen', { static: true }) aiOptionsScreen!: ElementRef<HTMLDialogElement>;
  @ViewChild('gameOverScreen', { static: true }) gameOverScreen!: ElementRef<HTMLDialogElement>;
  @ViewChild('boardElement', { static: true }) boardElement!: ElementRef;
  @ViewChildren('gridSpace') gridSpaces!: QueryList<ElementRef>;
  playerNames: Array<string> = ["red", "blue", "green", "yellow"];
  playerColors: Array<string> = ["#f54e42", "#4287f5", "#32a852", "#fcba03"];
  isAi: boolean = false;
  boardWidth: number = 7;
  boardHeight: number = 7;
  isCustom: boolean = false;
  players: Player[] = [];
  aiSearchDepth: number = 2;
  startPosition: string = "pickaxe";
  board: Array<Array<Space>> = Array.from({ length: this.boardHeight }, (_, row) => Array.from({ length: this.boardWidth }, (_, col) => ({col,row,value:0})));
  boardElements: ElementRef[][] = [];
  isPlaying: boolean = false;
  turnCount: number = 0;

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

  initializeBoardVariant(variant: string, playerCount: number) {
    console.log(this.players)
    if (variant == "custom") this.isCustom = true;
    if (variant == "pickaxe") {
      this.board[1][1].player = structuredClone(this.players[0]);
      this.split(1, 1,this.board);
      this.split(0, 1,this.board);
      this.split(1, 0,this.board);

      this.board[this.boardWidth-2][this.boardHeight-2].player = structuredClone(this.players[1]);
      this.split(this.boardWidth-2, this.boardHeight-2,this.board);
      this.split(this.boardWidth-1, this.boardHeight-2,this.board);
      this.split(this.boardWidth-2, this.boardHeight-1,this.board);

      if (playerCount >= 3) {
        this.board[this.boardWidth-2][1].player = structuredClone(this.players[2]);
        this.split(this.boardWidth-2, 1, this.board);
        this.split(this.boardWidth-1, 1, this.board);
        this.split(this.boardWidth-2, 0, this.board);
      }

      if (playerCount >= 4) {
        this.board[1][this.boardHeight-2].player = structuredClone(this.players[3]);
        this.split(1, this.boardHeight-2, this.board);
        this.split(0, this.boardHeight-2, this.board);
        this.split(1, this.boardHeight-1, this.board);
      }
    }

    if (variant == "corners") {
      this.board[1][1].player = structuredClone(this.players[0]);
      this.split(1, 1, this.board);

      this.board[this.boardWidth-2][this.boardHeight-2].player = structuredClone(this.players[1]);
      this.split(this.boardWidth-2, this.boardHeight-2, this.board);

      if (playerCount >= 3) {
        this.board[this.boardWidth-2][1].player = structuredClone(this.players[2]);
        this.split(this.boardWidth-2, 1,this.board);
      }

      if (playerCount >= 4) {
        this.board[1][this.boardHeight-2].player = structuredClone(this.players[3]);
        this.split(1, this.boardHeight-2,this.board);
      }
    }
  }

  start(playerCount: number) {
    if (playerCount == 1) {
      this.aiOptionsScreen.nativeElement.showModal();
      this.isAi = true;
      this.players = this.populatePlayers(2);
    } else {
      this.players = this.populatePlayers(playerCount);
      this.isPlaying = true;
    }
    console.log(this.board);
    this.initializeBoardVariant(this.startPosition, this.players.length);
  }

  populatePlayers(playerCount: number): Array<Player> {
    return Array.from({length: playerCount}, (_, index:number) => ({id: index, color: this.playerColors[index], name: this.playerNames[index]}));
  }

  aiOptionsSubmit() {
    this.aiOptionsScreen.nativeElement.close();
    this.isPlaying = true;
  }

  setPlayer(col: number, row: number, board: Array<Array<Space>>, player: Player | undefined) {
    if (col < 0 || col >= this.boardWidth || row < 0 || row >= this.boardHeight) return board;
    board[row][col].player = player;
    return board;
  }

  increase(col: number, row: number, board: Array<Array<Space>>) {
    if (col < 0 || col >= this.boardWidth || row < 0 || row >= this.boardHeight || board[row][col].value >= 4) return board;
    board[row][col].value++;
    return board;
  }

  split(col: number, row: number, board: Array<Array<Space>>) {
    const thisPlayer = board[row][col].player;
    board[row][col].value = 0;
    board = this.increase(col+1, row, board);
    board = this.increase(col-1, row, board);
    board = this.increase(col, row+1, board);
    board = this.increase(col, row-1, board);

    board = this.setPlayer(col+1, row, board, thisPlayer);
    board = this.setPlayer(col-1, row, board, thisPlayer);
    board = this.setPlayer(col, row+1, board, thisPlayer);
    board = this.setPlayer(col, row-1, board, thisPlayer);
    return board;
  }

  pressed(col: number, row: number) {
    const currentPlayer = this.players[this.turnCount%this.players.length];
    if (!this.board[row][col].player) return;
    if (this.board[row][col].value >= 4) return;
    if (this.board[row][col].player.id != currentPlayer.id) return;
    else this.board[row][col].value++;
    if (this.isCustom && this.turnCount < this.players.length) this.board[row][col].value = 3;
    this.switchPlayer();
  }

  switchPlayer() {
    const cycles = this.calculateCycles(structuredClone(this.board));
    this.renderCycles(cycles);
    console.log()
    this.turnCount++;
  }

  renderCycles(cycles: Array<Array<Space>>) {
    if (cycles.length == 0) return;
    for (let i = 0; i < cycles[0].length; i++) {
      this.board = this.split(cycles[0][i].col, cycles[0][i].row, this.board);
    }
    setTimeout(() => this.renderCycles(cycles.slice(1)), 500);
  }

  calculateCycles(board: Array<Array<Space>>): Array<Array<Space>> {
    const squaresToSplit: Array<Space> = board.flat().filter(space => space.value == 4);
    for (let i = 0; i < squaresToSplit.length; i++) board = this.split(squaresToSplit[i].col, squaresToSplit[i].row, board);
    if (board.flat().filter(space => space.value == 4).length > 0) return [squaresToSplit].concat(this.calculateCycles(structuredClone(board)));
    return [squaresToSplit];
  }
}

