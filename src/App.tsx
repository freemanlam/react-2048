import { FC, useEffect, useState } from 'react';
import * as confetti from 'canvas-confetti';
import Hammer from 'react-hammerjs';
import './App.scss';
import {
  GameStates,
  initialGrid,
  loadStateFromStorage,
  saveStateToStorage,
  transpose,
  Tile,
} from './game.store';
import TileComponent from './tile';

const random = (min: number, max: number) => Math.random() * (max - min) + min;
const showConfetti = async () => {
  const myConfetti = confetti.create(
    document.querySelector('canvas') as HTMLCanvasElement,
    { resize: true }
  );
  for (let i = 1; i <= 3; i++) {
    setTimeout(() => {
      new Array(5).fill(0).map(() =>
        myConfetti({
          angle: random(60, 120),
          spread: random(10, 50),
          particleCount: random(40, 50),
          origin: {
            y: 0.6,
          },
        })
      );
    }, 750 * i);
  }
};
const onWin = () => showConfetti();

const triggerKeyEvent = (key: string) =>
  window.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
    })
  );

const App: FC = () => {
  const [infoOpen, setInfoOpen] = useState(false);
  const [grid, setGrid] = useState<Tile[][]>([]);
  useEffect(() => {
    const tiles: Tile[] = [];
    grid.forEach((row) => {
      row.forEach((tile) => {
        if (tile.value === 0) {
          return;
        }
        tiles.push(tile);
      });
    });
    setTiles(tiles);
  }, [grid]);

  const [score, setScore] = useState(0);
  useEffect(() => {
    if (score === 2048) {
      setState(GameStates.WIN);
    }
  }, [score]);

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [state, setState] = useState(GameStates.INITIALIZED);

  useEffect(() => {
    const storageState = loadStateFromStorage();
    if (storageState) {
      setGrid(storageState.grid);
      setScore(storageState.score);
      setState(storageState.gameState);
    } else {
      setGrid(initialGrid());
    }
  }, []);

  const generateRandomNumber = (grid: Tile[][]) => {
    const emptyTiles: Tile[] = [];
    grid.forEach((row) => {
      row.forEach((tile) => {
        if (tile.value === 0) {
          emptyTiles.push(tile);
        }
      });
    });
    if (emptyTiles.length === 0) {
      setState(GameStates.LOSE);
      return grid;
    }
    const randomIndex = Math.floor(Math.random() * emptyTiles.length);
    const { row, col } = emptyTiles[randomIndex].meta.position;
    return [
      ...grid.slice(0, row),
      [
        ...grid[row].slice(0, col),
        Math.random() > 0.9
          ? new Tile(4, {
              position: { row, col },
              isNew: true,
            })
          : new Tile(2, {
              position: { row, col },
              isNew: true,
            }),
        ...grid[row].slice(col + 1),
      ],
      ...grid.slice(row + 1),
    ];
  };

  useEffect(() => {
    const moveLeft = () => {
      const transformed = transformGrid([...grid], score, {
        isReverse: true,
      });

      setGrid(generateRandomNumber(transformed));
    };
    const moveRight = () => {
      const transformed = transformGrid([...grid], score, {});

      setGrid(generateRandomNumber(transformed));
    };
    const moveTop = () => {
      const transposed = transpose([...grid]);
      const transformed = transformGrid([...transposed], score, {
        isTranspose: true,
        isReverse: true,
      });
      const reverseTransposed = transpose(transformed);
      setGrid(reverseTransposed);

      setGrid(generateRandomNumber(reverseTransposed));
    };
    const moveBottom = () => {
      const transposed = transpose([...grid]);
      const transformed = transformGrid([...transposed], score, {
        isTranspose: true,
      });
      const reverseTransposed = transpose(transformed);

      setGrid(generateRandomNumber(reverseTransposed));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          moveLeft();
          break;
        case 'ArrowRight':
          moveRight();
          break;
        case 'ArrowUp':
          moveTop();
          break;
        case 'ArrowDown':
          moveBottom();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [grid, score]);

  const transformGrid = (
    grid: Tile[][],
    score: number,
    { isTranspose = false, isReverse = false }
  ) => {
    for (
      let rowIndex = !isReverse ? 0 : grid.length - 1;
      !isReverse ? rowIndex < grid.length : rowIndex >= 0;
      !isReverse ? rowIndex++ : rowIndex--
    ) {
      const row = grid[rowIndex];
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const tile = row[colIndex];
        if (tile.value === 0) {
          continue;
        }
        let nextColIndex = colIndex + (!isReverse ? 1 : -1);
        while (!isReverse ? nextColIndex < row.length : nextColIndex >= 0) {
          const nextTile = row[nextColIndex];
          if (nextTile.value === 0) {
            if (!isReverse) {
              nextColIndex++;
            } else {
              nextColIndex--;
            }
            continue;
          }
          if (tile.value === nextTile.value) {
            const newTile = new Tile(tile.value * 2, {
              position: {
                row: isTranspose ? nextColIndex : rowIndex,
                col: isTranspose ? rowIndex : nextColIndex,
              },
              merged: true,
            });
            grid[rowIndex][nextColIndex] = newTile;
            grid[rowIndex][colIndex] = new Tile(0, {
              position: {
                row: isTranspose ? colIndex : rowIndex,
                col: isTranspose ? rowIndex : colIndex,
              },
            });
            setScore(score < newTile.value ? newTile.value : score || 0);
            colIndex = nextColIndex;
          }
          break;
        }
      }
      const filtered = grid[rowIndex].filter((tile) => tile.value !== 0);
      const missing = 4 - filtered.length;
      const zeros = Array(missing).fill(
        new Tile(0, {
          position: { row: rowIndex, col: 0 },
        })
      );
      const combo = !isReverse
        ? [...zeros, ...filtered]
        : [...filtered, ...zeros];
      grid[rowIndex] = combo.map((tile, index) => {
        if (tile.value !== 0) {
          return new Tile(tile.value, {
            ...tile.meta,
            position: {
              row: isTranspose ? index : rowIndex,
              col: isTranspose ? rowIndex : index,
            },
          });
        }
        return new Tile(0, {
          ...tile.meta,
          position: {
            row: isTranspose ? index : rowIndex,
            col: isTranspose ? rowIndex : index,
          },
          isNew: false,
        });
      });
    }
    return grid;
  };

  const toggleInfo = () => setInfoOpen(!infoOpen);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (state !== GameStates.WIN) {
        return;
      }
      onWin();
    }, 200);
    return () => {
      clearTimeout(timer);
    };
  }, [state]);

  useEffect(() => {
    saveStateToStorage({
      grid,
      score,
      gameState: state,
    });
  }, [grid, score, state]);

  const restart = () => {
    setScore(0);
    setGrid(initialGrid());
    setState(GameStates.INITIALIZED);
  };

  return (
    <Hammer
      onSwipeLeft={() => triggerKeyEvent('ArrowLeft')}
      onSwipeRight={() => triggerKeyEvent('ArrowRight')}
      onSwipeUp={() => triggerKeyEvent('ArrowUp')}
      onSwipeDown={() => triggerKeyEvent('ArrowDown')}
      direction="DIRECTION_ALL"
    >
      <div className="App">
        <a
          className="fixed top-0 right-0 m-4 z-30"
          href="https://github.com/code-with-ahsan/ng-2048"
          target="_blank"
          rel="noreferrer noopener"
        >
          <img
            src="https://img.shields.io/github/stars/code-with-ahsan/ng-2048?style=social"
            alt="star the repo"
          />
        </a>
        <canvas className="w-full h-full absolute z-10"></canvas>

        <div className="w-full h-full flex flex-col justify-center items-center relative z-20">
          <div className="flex flex-col mb-1">
            <span className="text-indigo-500 text-4xl text-center">
              2048 Game
            </span>
          </div>
          {(() => {
            switch (state) {
              case GameStates.WIN:
                return (
                  <div>
                    <div className="text-5xl text-green-700 text-center">
                      You Win!
                    </div>
                    <div className="text-4xl text-green-600 text-center">
                      Score : {score}
                    </div>
                    <button
                      className="w-full p-1 rounded bg-indigo-500 text-white text-2xl hover:bg-indigo-600"
                      onClick={restart}
                    >
                      Restart
                    </button>
                  </div>
                );
              case GameStates.LOSE:
                return (
                  <div>
                    <div className="text-5xl text-red-700 text-center">
                      Try again!
                    </div>
                    <div className="text-4xl text-red-600 text-center">
                      Score : {score}
                    </div>
                    <button
                      className="w-full p-1 rounded bg-indigo-500 text-white text-2xl hover:bg-indigo-600"
                      onClick={restart}
                    >
                      Restart
                    </button>
                  </div>
                );
              default:
                return (
                  <>
                    <div className="score">
                      <div className="text-2xl">Score : {score}</div>
                    </div>
                    <div className="game w-[312px] h-[312px] relative mb-3">
                      <div className="grid-container absolute z-10">
                        {grid.map((row, rowIndex) => (
                          <div className="row grid grid-cols-4" key={rowIndex}>
                            {row.map((col, colIndex) => (
                              <div
                                className="col w-12 h-12 rounded flex items-center justify-center border border-black"
                                key={colIndex}
                              >
                                <div className="text-2xl">&nbsp;</div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                      <div className="tiles absolute z-20">
                        {tiles.map((tile) => (
                          <TileComponent tile={tile}></TileComponent>
                        ))}
                      </div>
                    </div>
                    <button
                      className="py-0.5 px-2 mb-2 rounded bg-indigo-500 text-white text-sm hover:bg-indigo-600"
                      onClick={restart}
                    >
                      Restart
                    </button>
                  </>
                );
            }
          })()}
          <a
            className="text-xl text-red-700 text-center underline underline-offset-2"
            href="https://youtube.com/CodeWithAhsan"
          >
            Code With Ahsan
          </a>
        </div>

        <div
          onClick={toggleInfo}
          className={`transition-all info-container fixed h-full z-40 flex items-start pt-14 md:pt-0 md:items-center top-0 bottom-0 ${
            infoOpen ? 'right-0' : '-right-[215px]'
          }`}
        >
          <div className="absolute h-max -left-16 top-14 md:top-0 md:bottom-0 m-auto rounded-sm info-button cursor-pointer hover:bg-slate-800 text-center bg-indigo-600 mr-[10px] py-0.5 px-2 text-xs text-white">
            How to play
          </div>
          <div className="rounded shadow-md bg-white border w-[210px] p-2">
            Use the arrow keys or the swipe gestures to move the tiles. Combine
            the tiles with the same numbers to merge them. Score a{' '}
            <b className="text-indigo-600">2048</b> tile to win.
          </div>
        </div>
        {infoOpen && (
          <div
            onClick={toggleInfo}
            className="fixed top-0 left-0 bg-slate-800 bg-opacity-50 z-30 h-full w-full"
          ></div>
        )}
      </div>
    </Hammer>
  );
};

export default App;
