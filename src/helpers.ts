import * as types from './types';
import { Game } from './app/game/game.component';

export function setPlayer(
  col: number,
  row: number,
  board: types.Space[][],
  player: types.Player | undefined,
) {
  const boardWidth = board[0].length;
  const boardHeight = board.length;
  if (col < 0 || col >= boardWidth || row < 0 || row >= boardHeight)
    return board;
  board[row][col].player = player;
  return board;
}

export function increase(
  col: number,
  row: number,
  board: types.Space[][],
) {
  const boardWidth = board[0].length;
  const boardHeight = board.length;
  if (
    col < 0 ||
    col >= boardWidth ||
    row < 0 ||
    row >= boardHeight ||
    board[row][col].value >= 4
  )
    return board;
  board[row][col].value++;
  return board;
}

export function split(col: number, row: number, board: types.Space[][]) {
  const layer = board[row][col].player;
  board[row][col].value = 0;
  board = increase(col + 1, row, board);
  board = increase(col - 1, row, board);
  board = increase(col, row + 1, board);
  board = increase(col, row - 1, board);

  board = setPlayer(col + 1, row, board, layer);
  board = setPlayer(col - 1, row, board, layer);
  board = setPlayer(col, row + 1, board, layer);
  board = setPlayer(col, row - 1, board, layer);
  return board;
}

export function initializeBoardVariant(
  variant: string,
  playerCount: number,
  board: types.Space[][],
  players: types.Player[],
) {
  const boardWidth = board[0].length;
  const boardHeight = board.length;
  if (variant == 'pickaxe') {
    board[1][1].player = structuredClone(players[0]);
    split(1, 1, board);
    split(0, 1, board);
    split(1, 0, board);

    if (playerCount == 2) {
      board[boardWidth - 2][boardHeight - 2].player = structuredClone(players[1]);
      split(boardWidth - 2, boardHeight - 2, board);
      split(boardWidth - 1, boardHeight - 2, board);
      split(boardWidth - 2, boardHeight - 1, board);
    }

    if (playerCount >= 3) {
      board[1][boardHeight - 2].player = structuredClone(players[1]);
      split(boardWidth - 2, 1, board);
      split(boardWidth - 1, 1, board);
      split(boardWidth - 2, 0, board);
      board[boardWidth - 2][boardHeight - 2].player = structuredClone(players[2]);
      split(boardWidth - 2, boardHeight - 2, board);
      split(boardWidth - 1, boardHeight - 2, board);
      split(boardWidth - 2, boardHeight - 1, board);
    }

    if (playerCount >= 4) {
      board[boardWidth - 2][1].player = structuredClone(players[3]);
      split(1, boardHeight - 2, board);
      split(0, boardHeight - 2, board);
      split(1, boardHeight - 1, board);
    }
  } else if (variant == 'corners') {
    board[1][1].player = structuredClone(players[0]);
    split(1, 1, board);

    if (playerCount == 2) {
      board[boardWidth - 2][boardHeight - 2].player = structuredClone(players[1]);
      split(boardWidth - 2, boardHeight - 2, board);
    }

    if (playerCount >= 3) {
      board[1][boardHeight - 2].player = structuredClone(players[1]);
      split(boardWidth - 2, 1, board);
      board[boardWidth - 2][boardHeight - 2].player = structuredClone(players[2]);
      split(boardWidth - 2, boardHeight - 2, board);
    }

    if (playerCount >= 4) {
      board[boardWidth - 2][1].player = structuredClone(players[3]);
      split(1, boardHeight - 2, board);
    }
  }
}

export function renderCycles(
  cycles: types.Space[][],
  callback: () => void,
  game: Game,
  callNextPlayer: boolean = true,
) {
  if (cycles.length == 0 || cycles[0].length == 0) {
    game.turnCount++;
    callback();
    if (callNextPlayer) game.switchPlayer();
    else {
      const hasWonGame = hasWon(game.board, game);
      if (hasWonGame) {
        game.gameOver(hasWonGame);
      }
    }
    return;
  }
  setTimeout(() => {
    for (let i = 0; i < cycles[0].length; i++) {
      game.board = split(cycles[0][i].col, cycles[0][i].row, game.board);
    }
    renderCycles(cycles.slice(1), callback, game, callNextPlayer);
  }, 400);
}

export function calculateCycles(
  board: types.Space[][],
): types.Space[][] {
  const squaresToSplit: types.Space[] = board
    .flat()
    .filter((space) => space.value == 4);
  for (let i = 0; i < squaresToSplit.length; i++)
    board = split(squaresToSplit[i].col, squaresToSplit[i].row, board);
  if (board.flat().filter((space) => space.value == 4).length > 0)
    return [squaresToSplit].concat(calculateCycles(structuredClone(board)));
  return [squaresToSplit];
}

export function calculateCyclesBoard(board: types.Board): types.Board {
  const splitableSquares: types.Space[] = board
    .flat()
    .filter((space) => space.value == 4);
  if (splitableSquares.length == 0) return board;
  for (let i = 0; i < splitableSquares.length; i++)
    board = split(splitableSquares[i].col, splitableSquares[i].row, board);
  return calculateCyclesBoard(board);
}

export function calculateCycleResponse(
  cycles: types.Space[][],
  board: types.Board
) {
  if (cycles.length == 0) return;
  for (let i = 0; i < cycles[0].length; i++) {
    board = split(cycles[0][i].col, cycles[0][i].row, board);
  }
  calculateCycleResponse(cycles.slice(1), board);
}

export function isGameOver(
  board: types.Board,
  player: types.Player,
  opponent: types.Player,
): boolean {
  return (
    getAllOfPlayer(board, opponent).length == 0 ||
    getAllOfPlayer(board, player).length == 0
  );
}

export function getAllOfPlayer(
  board: types.Board,
  player: types.Player,
): types.Space[] {
  return board.flatMap((row) =>
    row.filter(
      (cell) => cell.player && cell.player.id === player.id && cell.value !== 0,
    ),
  );
}

export function cloneBoard(array: types.Space[][]): types.Space[][] {
  return array.map((row) =>
    row.map((space) => ({
      col: space.col,
      row: space.row,
      value: space.value,
      player: space.player, // clone player if needed, otherwise pass by reference
    })),
  );
}

export function checkResponse(board: types.Board, cell: types.Space) {
  let boardCopy = cloneBoard(board);
  boardCopy = increase(cell.col, cell.row, boardCopy);
  calculateCycleResponse(calculateCycles(cloneBoard(boardCopy)), boardCopy);
  return boardCopy;
}

export function staticEval(
  board: types.Board,
  player: types.Player,
  opp: types.Player,
): number {
  return (
    getAllOfPlayer(board, player).reduce((acc, cur) => acc + cur.value, 0) -
    getAllOfPlayer(board, opp).reduce((acc, cur) => acc + cur.value, 0) +
    getAllOfPlayer(board, player).length -
    getAllOfPlayer(board, opp).length
  );
}

export function maxPossibleStaticEval(
  board: types.Board,
  player: types.Player,
  opp: types.Player,
): number {
  return (
    getAllOfPlayer(board, player).reduce((acc, cur) => acc + cur.value, 0) +
    getAllOfPlayer(board, opp).reduce((acc, cur) => acc + cur.value, 0) +
    getAllOfPlayer(board, player).length +
    getAllOfPlayer(board, opp).length
  );
}

export function minimax(
  position: types.Board,
  depth: number,
  isMax: boolean,
  maxPlayer: types.Player,
  minPlayer: types.Player,
  alpha: number,
  beta: number,
  difficulty: number,
): [number, types.Space[]] {
  if (depth == 0 || isGameOver(position, maxPlayer, minPlayer)) {
    return [staticEval(position, maxPlayer, minPlayer), []];
  }

  if (isMax) {
    let maxEval: number = -Infinity;
    let bestMoveSequence: types.Space[] = [];
    const possibleMoves: types.Space[] = getAllOfPlayer(
      position,
      maxPlayer,
    );
    const outcomes: types.Space[][][] = possibleMoves.map(
      (cell: types.Space) => checkResponse(position, cell),
    );

    for (let i = 0; i < outcomes.length; i++) {
      const childEval = minimax(
        outcomes[i],
        depth - 1,
        false,
        maxPlayer,
        minPlayer,
        alpha,
        beta,
        difficulty,
      );
      const noisyEval =
        childEval[0] + (Math.random() - 0.5) * (10 - difficulty)

      alpha = Math.max(alpha, noisyEval);

      if (noisyEval > maxEval) {
        maxEval = noisyEval;
        bestMoveSequence = [possibleMoves[i]].concat(childEval[1]);
      }

      if (beta <= alpha) break;
    }
    return [maxEval, bestMoveSequence];
  } else {
    let minEval: number = Infinity;
    let bestMoveSequence: types.Space[] = [];
    const possibleMoves: types.Space[] = getAllOfPlayer(
      position,
      minPlayer,
    );
    const outcomes: types.Space[][][] = possibleMoves.map(
      (cell: types.Space) => checkResponse(position, cell),
    );

    for (let i = 0; i < outcomes.length; i++) {
      const childEval = minimax(
        outcomes[i],
        depth - 1,
        true,
        maxPlayer,
        minPlayer,
        alpha,
        beta,
        difficulty,
      );
      const noisyEval =
        childEval[0] + (Math.random() - 0.5) * (10 - difficulty); // Adds a noise factor based on difficulty

      beta = Math.min(beta, noisyEval);

      if (noisyEval < minEval) {
        minEval = noisyEval;
        bestMoveSequence = [possibleMoves[i]].concat(childEval[1]);
      }

      if (beta <= alpha) break;
    }
    return [minEval, bestMoveSequence];
  }
}

export function hasWon(board: types.Board, game: Game) {
  if (game.isCustom && game.turnCount < game.players.length) return false;
  let playersStillPlaying = 0;
  let winner;
  for (let i = 0; i < game.players.length; i++) {
    if (getAllOfPlayer(board, game.players[i]).length) {
      playersStillPlaying++;
      winner = game.players[i];
    } else continue;
    if (playersStillPlaying > 1) return false;
  }
  return winner;
}

export function evalBarWidth(game: Game) {
  if (game.isCustom && game.turnCount < game.players.length) return '50%';
  return (
    Math.round(
      (getAllOfPlayer(game.board, game.players[0]).length /
        (getAllOfPlayer(game.board, game.players[0]).length +
          getAllOfPlayer(game.board, game.players[1]).length)) *
        100,
    ) + '%'
  );
}
