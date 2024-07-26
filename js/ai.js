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
    row.filter((cell) => cell.player && cell.player.playerId === player.playerId)
  );
};

const random_item = items => items[Math.floor(Math.random() * items.length)];

const canBlowUpHowMany = (board, cell, prev=[]) => {
	if (cell.value < 3) return 0;
	const boardCopy = copyBoard(board);
	boardCopy[cell.y][cell.x].increase();
	return cycle(board, false, false);
}

const searchBoard = (board, pattern) => {
	const matches = [];
	for (let i = 0; i < 3; i++) {
		board = rotate2DArray(board);
		for (let j = 0; j < board.length-pattern.length; j++) {
			for (let k = 0; k < board[0].length-pattern[0].length; k++) {
				const checkSquare = () => {
					for (let l = 0; l < pattern.length; l++) {
						for (let m = 0; m < pattern[0].length; m++) {
							if (pattern[l][m] != board[j][k]) {
								return false;
							}
						}
					}
					return true;
				}
				if (checkSquare()) matches.push(board[j][k]);
			}
		}
	}
	return matches;
}

const aiGetMove = (board, difficulty, player) => {
	const possibleMoves = getAllOfPlayer(board, player);
	if (difficulty == 1) {
		const canBlowUpHowManyList = possibleMoves.map((cell) => [canBlowUpHowMany(board, cell), cell]).sort((a,b)=>a[0]-b[0]);

		// const moveScores = possibleMoves.map((square) => {
		// 		const boardCopy = copyBoardWithoutElements(board);
		// 		boardCopy[square.y][square.x].increase();
		// 		cycle(boardCopy, false, false, player);
		// 		return [getAllOfPlayer(boardCopy, player).length, square];
		// 	})
		// 	.sort((a, b) => a[0]-b[0]);
		// const bestMove = moveScores[0];
		// console.log(moveScores);
		// return board[bestMove[1].y][bestMove[1].x];
	}
};
