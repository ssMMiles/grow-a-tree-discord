import { HydratedDocument } from "mongoose";
import { ITree } from "../models/Guild";
import { SHOW_LAST_X_BLOCKS } from "./image-generation";

export const TILES = {
  BASE: 0,
  SMALL_HOLE: 1,
  LARGE_HOLE: 2,
  RIGHT_BRANCH_1: 3,
  LEFT_BRANCH_1: 4,
  RIGHT_BRANCH_2: 5,
  LEFT_BRANCH_2: 6
};

export const LEFT_BRANCHES = [TILES.LEFT_BRANCH_1, TILES.LEFT_BRANCH_2];

export const RIGHT_BRANCHES = [TILES.RIGHT_BRANCH_1, TILES.RIGHT_BRANCH_2];

export const BRANCHES = [...LEFT_BRANCHES, ...RIGHT_BRANCHES];

export function generateNextSegment(tree: HydratedDocument<ITree>): number {
  const recentPieces = tree.pieces.slice(-SHOW_LAST_X_BLOCKS).reverse();

  if (BRANCHES.includes(recentPieces[0])) return getRandomTileWithoutBranch();

  if (BRANCHES.includes(recentPieces[1])) {
    if (LEFT_BRANCHES.includes(recentPieces[1])) return getRandomTileRightBranch();
    if (RIGHT_BRANCHES.includes(recentPieces[1])) return getRandomTileLeftBranch();
  }

  for (let i = 2; i < recentPieces.length; i++) {
    const piece = recentPieces[i];

    if (LEFT_BRANCHES.includes(piece)) return getRandomTileRightBranch();
    if (RIGHT_BRANCHES.includes(piece)) return getRandomTileRightBranch();
  }

  return getRandomTile();
}

export function weightedRandomizer(entries: { id: number; weight: number }[], tableSize = 10): () => number {
  const table: number[] = [];

  for (const { id, weight } of entries) {
    for (let j = 0; j < weight * tableSize; j++) {
      table.push(id);
    }
  }

  return function () {
    return table[Math.floor(Math.random() * table.length)];
  };
}

const getRandomTile = weightedRandomizer(
  [
    {
      id: TILES.BASE,
      weight: 0.5
    },
    {
      id: TILES.SMALL_HOLE,
      weight: 0.04
    },
    {
      id: TILES.LARGE_HOLE,
      weight: 0.01
    },
    {
      id: TILES.RIGHT_BRANCH_1,
      weight: 0.125
    },
    {
      id: TILES.LEFT_BRANCH_1,
      weight: 0.125
    },
    {
      id: TILES.RIGHT_BRANCH_2,
      weight: 0.125
    },
    {
      id: TILES.LEFT_BRANCH_2,
      weight: 0.125
    }
  ],
  100000
);

const getRandomTileWithoutBranch = weightedRandomizer(
  [
    {
      id: TILES.BASE,
      weight: 0.9
    },
    {
      id: TILES.SMALL_HOLE,
      weight: 0.04
    },
    {
      id: TILES.LARGE_HOLE,
      weight: 0.01
    }
  ],
  10000
);

const getRandomTileLeftBranch = weightedRandomizer(
  [
    {
      id: TILES.BASE,
      weight: 0.55
    },
    {
      id: TILES.SMALL_HOLE,
      weight: 0.04
    },
    {
      id: TILES.LARGE_HOLE,
      weight: 0.01
    },
    {
      id: TILES.LEFT_BRANCH_1,
      weight: 0.2
    },
    {
      id: TILES.LEFT_BRANCH_2,
      weight: 0.2
    }
  ],
  10000
);

const getRandomTileRightBranch = weightedRandomizer(
  [
    {
      id: TILES.BASE,
      weight: 0.55
    },
    {
      id: TILES.SMALL_HOLE,
      weight: 0.04
    },
    {
      id: TILES.LARGE_HOLE,
      weight: 0.01
    },
    {
      id: TILES.RIGHT_BRANCH_1,
      weight: 0.2
    },
    {
      id: TILES.RIGHT_BRANCH_2,
      weight: 0.2
    }
  ],
  10000
);
