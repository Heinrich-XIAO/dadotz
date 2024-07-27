class Space {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.value = 0;
		this.player = { playerId: -1, playerColor: "#000" };
		this.element = null;
		this.willSplitNextCycle = false;
	}

	setValue(value) {
		if (value < 0) {
			throw new Error("Parameter is not a valid value.")
		}

		if (value > 4) value = 4;
		this.value = value;
		if (this.element) {
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
		}

		if (value === 1 && this.element) {
			this.element.classList.add('one-dot');
		} else if (value === 2 && this.element) {
			this.element.classList.add('two-dots');
		} else if (value === 3 && this.element) {
			this.element.classList.add('three-dots');
		} else if (value >= 4) {
			if (this.element) this.element.classList.add('four-dots');
			this.willSplitNextCycle = true;
			this.value = 4;
		} else if (this.value == 0) {
		}
	}

	setPlayer(player) {
		this.player = structuredClone(player);
	}

	increase() {
		this.setValue(this.value + 1);
	}

	split(board) {
		const increase = (x, y) => {
			try {
				board[y][x].setPlayer(this.player);
				board[y][x].increase();
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
