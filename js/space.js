class Space {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.parentBoard = undefined;
		this.value = 0;
		this.player = { playerId: -1, playerColor: "#000" };
		this.element = undefined;
		this.willSplitNextCycle = false;
	}

	setValue(value) {
		this.value = value;
		this.element.textContent = "";
		this.element.classList.remove("one-dot");
		this.element.classList.remove("two-dots");
		this.element.classList.remove("three-dots");
		this.element.classList.remove("four-dots");
		for (let i = 1; i <= value; i++) {
			const dot = document.createElement('div');
			dot.classList.add('dot');
			dot.style.backgroundColor = this.player.playerColor;
			this.element.appendChild(dot);
		}

		if (value === 1) {
			this.element.classList.add('one-dot');
		} else if (value === 2) {
			this.element.classList.add('two-dots');
		} else if (value === 3) {
			this.element.classList.add('three-dots');
		} else if (value == 4) {
			this.element.classList.add('four-dots');
			this.willSplitNextCycle = true;
		} else if (this.value == 0) {
			this.player.playerId = -1;
			this.player.playerColor = "#000";
		}
	}

	setPlayer(player) {
		this.player = structuredClone(player);
	}

	increase() {
		this.setValue(this.value + 1);
	}

	split() {
		const increase = (x, y) => {
			try {
				this.parentBoard[y][x].setPlayer(this.player);
				this.parentBoard[y][x].increase();
				console.log(this.player);
			} catch (error) {
				if (!(error instanceof TypeError)) {
					console.error('Unexpected error:', error);
				}
			}
		}
		increase(this.x, this.y + 1);
		increase(this.x, this.y - 1);
		increase(this.x + 1, this.y);
		increase(this.x - 1, this.y);
		this.setValue(0);
		this.willSplitNextCycle = false;
	}
}
