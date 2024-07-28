// Constant definitions
const boardWidth = 7;
const boardHeight = 7;
const cycleDelay = 250;
const playerColors = ["#f54e42", "#4287f5", "#32a852", "#fcba03"]; 
const playerNames = ["red", "blue", "green", "yellow"]
const players = [];


const board = Array.from({ length: boardHeight }, (_, row) => Array.from({ length: boardWidth }, (_, col) => new Space(col, row)));

// Global variable variables
let actingPlayer = players[0];
let turnCount = 0;
let playerCanGo = true;
let playerCount = 2;
let isAI = false;
let AIDifficulty;
let isCustom;

// Grab HTML stuff
const boardElement = document.getElementById("board");
const containerElement = document.getElementById("container");
const boardOptionsForm = document.getElementById("boardOptions");
const startPosSelect = document.getElementById("startPosSelect");
const gameOverScreen = document.getElementById("gameOverScreen");
const gameOverText = document.getElementById("gameOverText");
const rematches = document.querySelectorAll('.rematch');
const aiSearchDepthSelector = document.querySelector('#aiSearchDepth');
const aiOptionsScreen = document.querySelector('#aiOptionsScreen');
const aiOptionsSubmit = document.querySelector('#aiOptionsScreen input[type="submit"]');

const reset = (boardArg) => {
	for (let i = 0; i < boardHeight; i++) {
		for (let j = 0; j < boardWidth; j++) {
			boardArg[i][j].value = 0;
		}
	}
	turnCount = 0;
	playerCanGo = true;
	containerElement.style.backgroundColor = players[turnCount%playerCount].playerColor;
	actingPlayer = players[turnCount%playerCount];
};

const showWinner = winner => {
	let text;
	if (isAI) {
		if (winner.playerId == 0) {
			text = "You Won!";
		} else text = "AI Won!";
	} else {
		text = `${winner.name.charAt(0).toUpperCase()+winner.name.slice(1)} Won!`
	}
	gameOverText.textContent = text;
	gameOverScreen.showModal();
}

const setToNextPlayer = () => {
	const winner = hasWon(board);
	if (winner) {
		showWinner(winner);
		return;
	}

	while (!isStillPlaying(board, turnCount%playerCount)) {
		turnCount++;
	}	
	containerElement.style.backgroundColor = players[turnCount%playerCount].playerColor;
	actingPlayer = players[turnCount%playerCount];
	if (isAI && turnCount%playerCount == 1) {
		playerCanGo = false;
		setTimeout((async () => {
			const move = await aiGetMove(board, aiSearchDepthSelector.value, players[turnCount%playerCount], players[(turnCount+1)%playerCount]);
			move.increase();
			turnCount++;
			cycle(board, true, false);
			containerElement.style.backgroundColor = players[turnCount%playerCount].playerColor;
			actingPlayer = players[turnCount%playerCount];
			playerCanGo = true;
		}), 500);
	} else {
		playerCanGo = true;
	}
}

const cycle = (boardArg=board, delay=true, changePlayer=true) => {
	const squaresToSplit = [];
	for (let i = 0; i < boardHeight; i++) {
		for (let j = 0; j < boardWidth; j++) {
			const square = boardArg[i][j];
			if (square.value == 4) {
				squaresToSplit.push(square);
			}
		}
	}

	for (let i = 0; i < squaresToSplit.length; i++) {
		const square = squaresToSplit[i];
		square.split(boardArg);
	}

	for (let i = 0; i < boardHeight; i++) {
		for (let j = 0; j < boardWidth; j++) {
			const square = boardArg[i][j];
			if (square.value == 4) {
				if (delay) return setTimeout(cycle, cycleDelay);
				else {
					cycle(boardArg, false, false);
					return boardArg;
				}
			}
		}
	}
	if (changePlayer) setToNextPlayer();
	return boardArg;
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
	if (space.player.playerId === currentPlayer.playerId && space.value != 0) {
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
	boardElement.innerHTML = '';
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
		board[1][1].split(board);
		board[0][1].split(board);
		board[1][0].split(board);

		board[boardWidth-2][boardHeight-2].player = structuredClone(players[1]);
		board[boardWidth-2][boardHeight-2].split(board);
		board[boardWidth-1][boardHeight-2].split(board);
		board[boardWidth-2][boardHeight-1].split(board);

		if (playerCount >= 3) {
			board[boardWidth-2][1].player = structuredClone(players[2]);
			board[boardWidth-2][1].split(board);
			board[boardWidth-1][1].split(board);
			board[boardWidth-2][0].split(board);
		}

		if (playerCount >= 4) {
			board[1][boardHeight-2].player = structuredClone(players[3]);
			board[1][boardHeight-2].split(board);
			board[0][boardHeight-2].split(board);
			board[1][boardHeight-1].split(board);
		}
	}
	if (variant == "corners") {
		board[1][1].player = structuredClone(players[0]);
		board[1][1].split(board);

		board[boardWidth-2][boardHeight-2].player = structuredClone(players[1]);
		board[boardWidth-2][boardHeight-2].split(board);

		if (playerCount >= 3) {
			board[boardWidth-2][1].player = structuredClone(players[2]);
			board[boardWidth-2][1].split(board);
		}

		if (playerCount >= 4) {
			board[1][boardHeight-2].player = structuredClone(players[3]);
			board[1][boardHeight-2].split(board);
		}
	}
}

const start = (playerCountArg) => {
	playerCount = playerCountArg;
	if (playerCount == 1) {
		isAI = true;
		playerCount = 2;
		aiOptionsScreen.showModal();
		aiOptionsSubmit.addEventListener('click', () => {
			aiOptionsScreen.close();
			AIDifficulty = aiSearchDepthSelector.value;
		})
	}
	for (let i = 0; i < playerCount; i++) {
		players.push({ playerId: i, playerColor: playerColors[i], name: playerNames[i] });
	}
	boardElement.style.display = "inline-flex";
	boardOptionsForm.style.display = "none";
	rematches.forEach(el => el.addEventListener('click', ()=>{
		reset(board);
		initializeBoard();
		gameOverScreen.close();
		start(playerCount);
	}));
	initializeBoardVariant(startPosSelect.value);
	
}


initializeBoard();
