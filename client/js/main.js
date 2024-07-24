// Constant definitions
const boardWidth = 7;
const boardHeight = 7;
const cycleDelay = 500;
const playerCount = 2;
const playerColors = ["#f54e42", "#4287f5", "#32a852", "#fcba03"];
const players = [];
for (let i = 0; i < playerCount; i++) {
	players.push({ playerId: i, playerColor: playerColors[i] });
}

const board = Array.from({ length: boardHeight }, (_, row) => Array.from({ length: boardWidth }, (_, col) => new Space(col, row)));
board.forEach((row, rowIndex) => {
	row.forEach((space, colIndex) => {
		space.parentBoard = board;
	});
});

let actingPlayer = players[0];
let turnCount = 0;
let playerCanGo = true;

const containerDiv = document.getElementById("container");

const checkIfCanSplit = (board) => {
	for (let i = 0; i < boardHeight; i++) {
		for (let j = 0; j < boardWidth; j++) {
			if (board[i][j].willSplitNextCycle) {
				return [j, i];
			}
		}
	}
	return false;
};

const cycle = () => {
	const currentPlayer = players[(turnCount-1) % playerCount];
	const squaresToSplit = [];
	for (let i = 0; i < boardHeight; i++) {
		for (let j = 0; j < boardWidth; j++) {
			const square = board[i][j];
			if (square.player.playerId == currentPlayer.playerId && square.value == 4) {
				squaresToSplit.push(square);
			}
		}
	}

	for (let i = 0; i < squaresToSplit.length; i++) {
		const square = squaresToSplit[i];
		square.split();
	}

	for (let i = 0; i < boardHeight; i++) {
		for (let j = 0; j < boardWidth; j++) {
			const square = board[i][j];
			if (square.player.playerId == currentPlayer.playerId && square.value == 4) {
				setTimeout(cycle, cycleDelay);
				return;
			}
		}
	}
	playerCanGo = true;
	containerDiv.style.backgroundColor = players[turnCount%playerCount].playerColor;
	actingPlayer = players[turnCount%playerCount];
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
	const currentPlayer = players[turnCount % playerCount];
	console.log(`${space.x},${space.y} clicked.`);
	if (space.player.playerId === currentPlayer.playerId) {
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
		containerDiv.style.backgroundColor = players[turnCount % playerCount].playerColor;
		actingPlayer = players[turnCount%playerCount];
	}
	if (space.willSplitNextCycle) {
		playerCanGo = false;
		setTimeout(cycle, cycleDelay);
	} else {
		containerDiv.style.backgroundColor = players[turnCount % playerCount].playerColor;
		actingPlayer = players[turnCount%playerCount];
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
			board[i][j].element.addEventListener("click", () => spaceOnClick(board[i][j]));
		}
	}
}


initializeBoard();
