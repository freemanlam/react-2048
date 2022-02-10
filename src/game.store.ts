export class Tile {
  constructor(
    public value = 0,
    public meta: {
      id?: number;
      position: { row: number; col: number };
      merged?: boolean;
      isNew?: boolean;
    }
  ) {
    this.meta.id = meta.id || Date.now() + Math.random();
  }
}

export enum GameStates {
  INITIALIZED = 'intialized',
  WIN = 'win',
  LOSE = 'lose',
}

export interface GameState {
  /** The tiles state. */
  grid: Tile[][];
  /** The current score */
  score: number;

  gameState: GameStates;
}

export const initialGrid = () => {
  const grid = new Array(4).fill(0).map((_, rowIndex) =>
    new Array(4).fill(0).map((_, colIndex) => {
      return new Tile(0, {
        position: { row: rowIndex, col: colIndex },
      });
    })
  );
  grid[0][0].value = 2;
  grid[2][3].value = 2;
  return grid;
};

const LOCAL_STORAGE_KEY = 'react-2048-game-state';

export const saveStateToStorage = (state: GameState) =>
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));

export const loadStateFromStorage = () => {
  const state = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  return state ? JSON.parse(state) : null;
};

export const transpose = (m: Tile[][]) =>
  m[0].map((_, i) =>
    m.map((x) => {
      const tile = x[i];
      return new Tile(tile.value, { ...tile.meta });
    })
  );
