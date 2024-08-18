export interface Player {
  id: number;
  color: string;
  name: string;
  isAI: boolean;
}

export interface Space {
  col: number;
  row: number;
  value: number;
  player?: Player;
}

export interface Move {
  col: number;
  row: number;
  value: number;
  player: Player;
}

export type DifficultyObject = {
  difficulty: number;
};

export type Game = {
  id: number;
  created_at: string;
  ended_at: string | null;
  moves: Array<Move>;
  player: string;
  opponent: string | null;
  ai_difficulty: DifficultyObject;
  winner?: string;
  startpos: string;
}

export type Board = Array<Array<Space>>;

