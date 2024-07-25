// Constant definitions
const boardWidth = 7;
const boardHeight = 7;
const cycleDelay = 250;
const playerColors = ["#f54e42", "#4287f5", "#32a852", "#fcba03"];
const players = [];


const board = Array.from({ length: boardHeight }, (_, row) => Array.from({ length: boardWidth }, (_, col) => new Space(col, row)));
board.forEach((row, rowIndex) => {
	row.forEach((space, colIndex) => {
		space.parentBoard = board;
	});
});

// Global variable variables
let actingPlayer = players[0];
let turnCount = 0;
let playerCanGo = true;
let playerCount = 2;
let isCustom;

// Grab HTML stuff
const boardElement = document.getElementById("board");
const containerElement = document.getElementById("container");
const playerCountForm = document.getElementById("playerCountChoices");
const startPosSelect = document.getElementById("startPosSelect");


const setToNextPlayer = () => {
	while (!isStillPlaying(board, turnCount%playerCount)) {
		turnCount++;
	}
	containerElement.style.backgroundColor = players[turnCount%playerCount].playerColor;
	actingPlayer = players[turnCount%playerCount];
	playerCanGo = true;
}

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
	setToNextPlayer()
};

const isStillPlaying = (board, playerId) => {
  if (isCustom && turnCount <= playerCount) {
    return true;
  }
  return board.some(row => row.some(cell => cell.player.playerId === playerId));
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
		while (!isStillPlaying(board, currentPlayer.playerId)) {
			turnCount++;
		}
	}
	if (isCustom && turnCount < playerCount && space.player.playerId === -1) {
		space.setPlayer(currentPlayer);
		space.setValue(3);
		turnCount++;
		setToNextPlayer();
	}
	if (space.willSplitNextCycle) {
		playerCanGo = false;
		setTimeout(cycle, cycleDelay);
	} else {
		setToNextPlayer();
	}
};

const initializeBoard = () => {
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

const initializeBoardVariant = (variant) => {
	if (variant != "custom") isCustom = false;
	else isCustom = true;
	if (variant == "pickaxe") {
		board[1][1].player = structuredClone(players[0]);
		board[1][1].split();
		board[0][1].split();
		board[1][0].split();

		board[boardWidth-2][boardHeight-2].player = structuredClone(players[1]);
		board[boardWidth-2][boardHeight-2].split();
		board[boardWidth-1][boardHeight-2].split();
		board[boardWidth-2][boardHeight-1].split();

		if (playerCount >= 3) {
			board[boardWidth-2][1].player = structuredClone(players[2]);
			board[boardWidth-2][1].split();
			board[boardWidth-1][1].split();
			board[boardWidth-2][0].split();
		}

		if (playerCount >= 4) {
			board[1][boardHeight-2].player = structuredClone(players[3]);
			board[1][boardHeight-2].split();
			board[0][boardHeight-2].split();
			board[1][boardHeight-1].split();
		}
	}
	if (variant == "corners") {
		board[1][1].player = structuredClone(players[0]);
		board[1][1].split();

		board[boardWidth-2][boardHeight-2].player = structuredClone(players[1]);
		board[boardWidth-2][boardHeight-2].split();

		if (playerCount >= 3) {
			board[boardWidth-2][1].player = structuredClone(players[2]);
			board[boardWidth-2][1].split();
		}

		if (playerCount >= 4) {
			board[1][boardHeight-2].player = structuredClone(players[3]);
			board[1][boardHeight-2].split();
		}
	}
}

const start = (playerCountArg) => {
	playerCount = playerCountArg;
	for (let i = 0; i < playerCount; i++) {
		players.push({ playerId: i, playerColor: playerColors[i] });
	}
	boardElement.style.display = "inline-flex";
	playerCountForm.style.display = "none";
	initializeBoardVariant(startPosSelect.value);
}


initializeBoard();
