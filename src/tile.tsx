import { FC } from 'react';
import { Tile } from './game.store';
import './tile.scss';

const TileComponent: FC<{ tile: Tile }> = ({ tile }) => {
  return (
    <div
      className={`
        w-12 h-12 flex rounded items-center justify-center border border-black tile
        ${
          'tile-position-' +
          (tile.meta.position.row + 0) +
          '-' +
          (tile.meta.position.col + 0)
        }
        ${tile.value === 2 && 'bg-gray-100'}
        ${tile.value === 4 && 'bg-orange-100'}
        ${tile.value === 8 && 'bg-orange-200'}
        ${tile.value === 16 && 'bg-orange-300'}
        ${tile.value === 32 && 'bg-orange-400'}
        ${tile.value === 64 && 'bg-orange-500'}
        ${tile.value === 128 && 'bg-orange-600'}
        ${tile.value === 256 && 'bg-orange-700'}
        ${tile.value === 512 && 'bg-orange-800'}
        ${tile.value === 1024 && 'bg-orange-900'}
        ${tile.meta.merged && 'tile-merged'}
        ${tile.meta.isNew && 'tile-appear'}
      `}
      key={tile.meta.id}
    >
      <div className="text-2xl">{tile.value}</div>
    </div>
  );
};

export default TileComponent;
