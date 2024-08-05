import { Component, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

type Board = Array<Array<Space>>;

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  gameOverText: string = '';

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
    this.board = Array.from({ length: this.boardHeight }, (_, row) => Array.from({ length: this.boardWidth }, (_, col) => ({col,row,value:0})));
    this.boardElements = [];
    this.isPlaying = true;
    this.turnCount = 0;
    this.gameOverText = '';
    this.gameOverScreen.nativeElement.close();
    this.initializeBoardVariant(this.startPosition, this.players.length);
  }

  initializeBoardVariant(variant: string, playerCount: number) {
    if (variant == "custom") this.isCustom = true;
    else if (variant == "pickaxe") {
      this.board[1][1].player = structuredClone(this.players[0]);
      this.split(1, 1,this.board);
      this.split(0, 1,this.board);
      this.split(1, 0,this.board);

      this.board[this.boardWidth-2][this.boardHeight-2].player = structuredClone(this.players[1]);
      this.split(this.boardWidth-2, this.boardHeight-2,this.board);
      this.split(this.boardWidth-1, this.boardHeight-2,this.board);
      this.split(this.boardWidth-2, this.boardHeight-1,this.board);

      if (playerCount >= 3) {
        this.board[1][this.boardHeight-2].player = structuredClone(this.players[2]);
        this.split(this.boardWidth-2, 1, this.board);
        this.split(this.boardWidth-1, 1, this.board);
        this.split(this.boardWidth-2, 0, this.board);
      }

      if (playerCount >= 4) {
        this.board[this.boardWidth-2][1].player = structuredClone(this.players[3]);
        this.split(1, this.boardHeight-2, this.board);
        this.split(0, this.boardHeight-2, this.board);
        this.split(1, this.boardHeight-1, this.board);
      }
    } else if (variant == "corners") {
      this.board[1][1].player = structuredClone(this.players[0]);
      this.split(1, 1, this.board);

      this.board[this.boardWidth-2][this.boardHeight-2].player = structuredClone(this.players[1]);
      this.split(this.boardWidth-2, this.boardHeight-2, this.board);

      if (playerCount >= 3) {
        this.board[1][this.boardHeight-2].player = structuredClone(this.players[2]);
        this.split(this.boardWidth-2, 1,this.board);
      }

      if (playerCount >= 4) {
        this.board[this.boardWidth-2][1].player = structuredClone(this.players[3]);
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
    console.log(this.players)
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
    console.log(col, row, this.isCustom, this.turnCount < this.players.length)
    const currentPlayer = this.players[this.turnCount%this.players.length];
    if (this.isCustom && this.turnCount < this.players.length) {
      this.board[row][col].value = 3;
      this.board[row][col].player = currentPlayer;
    } else {
      if (!this.board[row][col].player) return;
      if (this.board[row][col].value >= 4) return;
      if (currentPlayer.id == 1 && this.isAi) return;
      if (this.board[row][col].player.id != currentPlayer.id) return;
      if (this.board[row][col].value != 0) this.board[row][col].value++;
    }
    const cycles = this.calculateCycles(structuredClone(this.board));
    this.renderCycles(cycles);
  }

  switchPlayer() {
    const hasWon = this.hasWon(this.board);
    if (hasWon) {
      this.gameOver(hasWon);
    }
    if (this.isAi && this.turnCount%2==1) {
      setTimeout(() => {
        console.time("AI Search");
        const bestMoves = this.minimax(structuredClone(this.board), this.aiSearchDepth, true, this.players[1], this.players[0], -Infinity, Infinity);
        console.timeEnd("AI Search");
        this.board = this.increase(bestMoves[1][0].col, bestMoves[1][0].row, this.board);
        const cycles = this.calculateCycles(structuredClone(this.board));
        this.renderCycles(cycles, false);
      }, 500);
    }
  }

  gameOver(player: Player) {
    if (this.isAi) {
      if (player.id == 0) this.gameOverText = "You Won!"
      else this.gameOverText = "AI Won!"
    } else this.gameOverText = `${player.name} Won!`
    this.gameOverScreen.nativeElement.showModal();
  }

  renderCycles(cycles: Array<Array<Space>>, callNextPlayer: boolean=true) {
    if (cycles.length == 0 || cycles[0].length == 0) {
      this.turnCount++;
      if (callNextPlayer) this.switchPlayer();
      else {
        const hasWon = this.hasWon(this.board);
        if (hasWon) {
          this.gameOver(hasWon);
        }
      }
      return;
    }
    setTimeout(() => {
      for (let i = 0; i < cycles[0].length; i++) {
        this.board = this.split(cycles[0][i].col, cycles[0][i].row, this.board);
      }
      this.renderCycles(cycles.slice(1), callNextPlayer)
    }, 250);
  }

  calculateCycles(board: Array<Array<Space>>): Array<Array<Space>> {
    const squaresToSplit: Array<Space> = board.flat().filter(space => space.value == 4);
    for (let i = 0; i < squaresToSplit.length; i++) board = this.split(squaresToSplit[i].col, squaresToSplit[i].row, board);
    if (board.flat().filter(space => space.value == 4).length > 0) return [squaresToSplit].concat(this.calculateCycles(structuredClone(board)));
    return [squaresToSplit];
  }

  calculateCycleResponse(cycles: Array<Array<Space>>, board: Board) {
    if (cycles.length == 0) return;
    for (let i = 0; i < cycles[0].length; i++) {
      board = this.split(cycles[0][i].col, cycles[0][i].row, board);
    }
    this.calculateCycleResponse(cycles.slice(1), board);
  }

  isGameOver(board: Board, player: Player, opponent: Player): boolean {
    return this.getAllOfPlayer(board, opponent).length == 0 || this.getAllOfPlayer(board, player).length == 0;
  }

  getAllOfPlayer(board: Board, player: Player): Array<Space> {
    return board.flatMap((row) =>
      row.filter((cell) => cell.player && cell.player.id === player.id && cell.value !== 0)
    );
  }

  checkResponse(board: Board, cell: Space) {
    let boardCopy = structuredClone(board);
    boardCopy = this.increase(cell.col, cell.row, boardCopy);
    this.calculateCycleResponse(this.calculateCycles(structuredClone(boardCopy)), boardCopy);
    return boardCopy;
  }

  staticEval(board: Board, player: Player, opp: Player): number {
    return this.getAllOfPlayer(board, player).reduce((acc, cur)=>acc+cur.value, 0) - this.getAllOfPlayer(board, opp).reduce((acc, cur)=>acc+cur.value, 0) + this.getAllOfPlayer(board, player).length - this.getAllOfPlayer(board, opp).length;
  }

  maxPossibleStaticEval(board: Board, player: Player, opp: Player): number {
    return this.getAllOfPlayer(board, player).reduce((acc, cur)=>acc+cur.value, 0) + this.getAllOfPlayer(board, opp).reduce((acc, cur)=>acc+cur.value, 0) + this.getAllOfPlayer(board, player).length + this.getAllOfPlayer(board, opp).length;
  }

  minimax(position: Board, depth: number, isMax: boolean, maxPlayer: Player, minPlayer: Player, alpha: number, beta: number): [number, Array<Space>] {
    if (depth == 0 || this.isGameOver(position, maxPlayer, minPlayer)) return [this.staticEval(position, maxPlayer, minPlayer), []];
    if (isMax) {
      let maxEval: number = -Infinity;
      let bestMoveSequence: Array<Space> = [];
      const possibleMoves: Array<Space> = this.getAllOfPlayer(position, maxPlayer);
      const outcomes: Array<Array<Array<Space>>> = possibleMoves.map((cell: Space)=>this.checkResponse(position, cell));
      for (let i = 0; i < outcomes.length; i++) {
        const childEval = this.minimax(outcomes[i], depth-1, false, maxPlayer, minPlayer, alpha, beta);
        alpha = Math.max(alpha, childEval[0]);
        if (childEval[0] > maxEval) {
          maxEval = childEval[0];
          bestMoveSequence = [possibleMoves[i]].concat(childEval[1]);
        }
        if (beta <= alpha) break;
      }
      return [maxEval, bestMoveSequence];
    } else {
      let minEval: number = Infinity;
      let bestMoveSequence: Array<Space> = [];
      const possibleMoves: Array<Space> = this.getAllOfPlayer(position, minPlayer);
      const outcomes: Array<Array<Array<Space>>> = possibleMoves.map((cell: Space)=>this.checkResponse(position, cell));
      for (let i = 0; i < outcomes.length; i++) {
        const childEval = this.minimax(outcomes[i], depth-1, true, maxPlayer, minPlayer, alpha, beta);
        beta = Math.min(beta, childEval[0]);
        if (childEval[0] < minEval) {
          minEval = childEval[0];
          bestMoveSequence = [possibleMoves[i]].concat(childEval[1]);
        }
        if (beta <= alpha) break;
      }
      return [minEval, bestMoveSequence];
    }
  }

  hasWon(board: Board) {
    if (this.isCustom && this.turnCount < this.players.length) return false;
    let playersStillPlaying = 0;
    let winner;
    for (let i = 0; i < this.players.length; i++) {
      if (this.getAllOfPlayer(board, this.players[i]).length) {
        playersStillPlaying++;
        winner = this.players[i];
      }
      else continue;
      if (playersStillPlaying>1) return false;
    }
    return winner;
  }

  evalBarWidth() {
    if (this.isCustom && this.turnCount < this.players.length) return "50%"
    return Math.round(this.getAllOfPlayer(this.board, this.players[0]).length/(this.getAllOfPlayer(this.board, this.players[0]).length+this.getAllOfPlayer(this.board, this.players[1]).length)*100)+'%';
  }
}

