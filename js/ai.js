const hasWon = (board) => {
	let playersStillPlaying = 0;
	let winner;
	for (let i = 0; i < players.length; i++) {
		if (getAllOfPlayer(board, players[i]).length) {
			playersStillPlaying++;
			winner = players[i];
		}
		else continue;
		if (playersStillPlaying>1) return false;
	}
	return winner;
}

const rotate2DArray = (board) => {
    // Get the number of rows and columns
    const rows = board.length;
    const cols = board[0].length;
    
    // Create a new matrix for the rotated result
    let rotatedBoard = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
    
    // Transpose and reverse each row
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            rotatedBoard[j][rows - 1 - i] = board[i][j];
        }
    }
    
    return rotatedBoard;
}

const copyBoard = (board) => {
  let newBoard = board.map(row => row.map(cell => {
    const newCell = Object.assign(new cell.constructor(), cell);
		newCell.element = null;
		return newCell;
  }));
	return newBoard;
}


const getAllOfPlayer = (board, player) => {
  return board.flatMap((row) => 
    row.filter((cell) => cell.player.playerId === player.playerId && cell.value !== 0)
  );
};

const randomItem = items => items[Math.floor(Math.random() * items.length)];

const randomBot = (board, player) => {
	return randomItem(getAllOfPlayer(board,player));
}

const checkResponse = (board, cell) => {
	const boardCopy = copyBoard(board);
	boardCopy[cell.y][cell.x].increase();
	return cycle(boardCopy, false, false);
}

const searchBoard = (board, pattern, playerId) => {
	const matches = [];
	let boardCopy = copyBoard(board);
	for (let i = 0; i < 4; i++) {
		boardCopy = rotate2DArray(boardCopy);
		for (let j = 0; j < boardCopy.length-pattern.length+1; j++) {
			for (let k = 0; k < boardCopy[0].length-pattern[0].length+1; k++) {
				const checkSquare = () => {
					for (let l = 0; l < pattern.length; l++) {
						for (let m = 0; m < pattern[0].length; m++) {
							if (pattern[l][m] == "*") continue;
							if (pattern[l][m] == boardCopy[j+l][k+m].value && boardCopy[j+l][k+m].player.playerId == playerId) continue;
							if (pattern[l][m] >= 0) return false; 
							if (pattern[l][m] == -boardCopy[j+l][k+m].value && boardCopy[j+l][k+m].player.playerId != playerId) continue;
							return false;
						}
					}
					return true;
				}

				if (checkSquare()) matches.push([board[boardCopy[j][k].y][boardCopy[j][k].x], (i+1)%4]);
			}
		}
	}
	return [
		...new Map(
				matches.map(x => [JSON.stringify(x), x])
		).values()
	];
};

const isGameOver = (board, player, opponent) => getAllOfPlayer(board, opponent) == [] || getAllOfPlayer(board, player) == [];

const staticEval = (board, player, opp) => {
	return getAllOfPlayer(board, player).reduce((acc, cur)=>acc+cur.value, 0) - getAllOfPlayer(board, opp).reduce((acc, cur)=>acc+cur.value, 0) + getAllOfPlayer(board, player).length - getAllOfPlayer(board, opp).length;
}

const maxPossibleStaticEval = (board, player, opp) => {
	return getAllOfPlayer(board, player).reduce((acc, cur)=>acc+cur.value, 0) + getAllOfPlayer(board, opp).reduce((acc, cur)=>acc+cur.value, 0) + getAllOfPlayer(board, player).length + getAllOfPlayer(board, opp).length;
}

const minimax = (position, depth, isMax, maxPlayer, minPlayer, alpha, beta) => {
	if (depth == 0 || isGameOver(position, maxPlayer, minPlayer)) return [staticEval(position, maxPlayer, minPlayer), []];
	if (isMax) {
		let maxEval = -Infinity;
		let bestMoveSequence;
		const possibleMoves = getAllOfPlayer(position, maxPlayer);
		const outcomes = possibleMoves.map(cell=>checkResponse(position, cell));
		for (let i = 0; i < outcomes.length; i++) {
			const childEval = minimax(outcomes[i], depth-1, false, maxPlayer, minPlayer, alpha, beta);
			alpha = Math.max(alpha, childEval[0]);
			if (childEval[0] > maxEval) {
				maxEval = childEval[0];
				bestMoveSequence = [possibleMoves[i]].concat(childEval[1]);
			}
			if (beta <= alpha) break;
		}
		return [maxEval, bestMoveSequence];
	} else {
		let minEval = Infinity;
		let bestMoveSequence;
		const possibleMoves = getAllOfPlayer(position, minPlayer);
		const outcomes = possibleMoves.map(cell=>checkResponse(position, cell));
		for (let i = 0; i < outcomes.length; i++) {
			const childEval = minimax(outcomes[i], depth-1, true, maxPlayer, minPlayer, alpha, beta);
			beta = Math.min(beta, childEval[0]);
			if (childEval[0] < minEval) {
				minEval = childEval[0];
				bestMoveSequence = [possibleMoves[i]].concat(childEval[1]);
			}
			if (beta <= alpha) break;
		}
		return [minEval, bestMoveSequence];
	}
};

const aiGetMove = async (board, searchDepth, player, opponent) => {
	const bestMoves = minimax(board,searchDepth,true,player,opponent,-Infinity,Infinity);
	return bestMoves[1][0];
};
