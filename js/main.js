// Constant definitions
const boardWidth = 7;
const boardHeight = 7;
const playerCount = 2;
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


const cycle = () => {
	let splits = 0;
	for (let i = 0; i < boardHeight; i++) {
		for (let j = 0; j < boardWidth; j++) {
			if (board[i][j].value == 4) {
				board[i][j].split();
				splits++;
			}
		}
	}
	if (splits) {
		cycle(); 
	} else {
		playerCanGo = true;
	}
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
	}
	if (turnCount < playerCount && space.player.playerId === -1) {
		space.setPlayer(currentPlayer);
		space.setValue(3);
		turnCount++;
	}

	if (space.willSplitNextCycle) {
		playerCanGo = false;
		setTimeout(cycle, 1000);
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
