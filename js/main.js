// Constant definitions
const boardWidth = 7;
const boardHeight = 7;
const cycleDelay = 500;
const playerCount = 4;
const playerColors = ["#f54e42", "#4287f5", "#32a852", "#fcba03"];
const players = [];
for (let i = 0; i < playerCount; i++) {
	players.push({playerId: i, playerColor: playerColors[i]});
}

const board = Array.from({ length: boardHeight }, (_, row) => Array.from({ length: boardWidth }, (_, col) => new Space(col, row)));
board.forEach((row, rowIndex) => {
  row.forEach((space, colIndex) => {
    space.parentBoard = board;
  });
});

let turnCount = 0;
let playerCanGo = true;

const containerDiv = document.getElementById("container");

const checkIfCanSplit = (board) => {
	for (let i = 0; i < boardHeight; i++) {
		for (let j = 0; j < boardWidth; j++) {
			if (board[i][j].willSplitNextCycle) {
				return [j,i];
			}
		}
	}
	return false;
};

const cycle = () => {
	for (let i = 0; i < boardHeight; i++) {
		for (let j = 0; j < boardWidth; j++) {
			if (board[i][j].willSplitNextCycle) {
				while (checkIfCanSplit(board)) {
					const [x, y] = checkIfCanSplit(board);
					board[y][x].split();
					playerCanGo = !checkIfCanSplit(board);
				}

				if (playerCanGo) {
					containerDiv.style.backgroundColor = players[turnCount%playerCount].playerColor;
				} else {
					setTimeout(cycle, cycleDelay); 
				}
				return;
			}
		}
	}
};

const isStillPlaying = (playerId) => {
	if (turnCount <= playerCount) {
		return true;
	}
	for (let i = 0; i < boardHeight; i++) {
		for (let j = 0; j < boardWidth; j++) {
			if (board[i][j].player.playerId == playerId) {
				return true;
			}
		}
	}
	return false;
}

const spaceOnClick = (space) => {
	if (!playerCanGo) {
		return;
	}
	const currentPlayer = players[turnCount%playerCount];
	console.log(`${space.x},${space.y} clicked.`);
	if (space.player.playerId === currentPlayer.playerId ) {
		space.increase();
		turnCount++;
		while (!isStillPlaying(currentPlayer.playerId)) {
			turnCount++;
		}
	}
	if (turnCount < playerCount && space.player.playerId === -1) {
		space.setPlayer(currentPlayer);
		space.setValue(3);
		turnCount++;
		while (!isStillPlaying(currentPlayer.playerId)) {
			turnCount++;
		}
		containerDiv.style.backgroundColor = players[turnCount%playerCount].playerColor;
	}
	if (space.willSplitNextCycle) {
		playerCanGo = false;
		setTimeout(cycle, cycleDelay);
	} else {
		containerDiv.style.backgroundColor = players[turnCount%playerCount].playerColor;
	}
};

const initializeBoard = () => {
	const boardElement = document.getElementById("board");
	const baseGridItem = document.createElement("div");

	baseGridItem.classList.add("gridSpace");

	for (let i = 0; i < boardHeight; i++) {
		const row = document.createElement("div");
		row.classList.add("row");
		for (let j = 0; j < boardWidth; j++) {
			const gridItem = baseGridItem.cloneNode(true);
			gridItem.id = `${j}-${i}`;

			board[i][j].element = gridItem;
			board[i][j].setValue(0);
			row.appendChild(gridItem);
		}
		boardElement.appendChild(row);
	}
	for (let i = 0; i < boardHeight; i++) {
		for (let j = 0; j < boardWidth; j++) {
			board[i][j].element.addEventListener("click", ()=>spaceOnClick(board[i][j]));
		}
	}
}


initializeBoard();
