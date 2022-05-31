import { HydratedDocument } from "mongoose";
import { IPlayer, Player } from "../models/Player";

/**
 * Increments the player's XP by the given amount. Returns the updated player document.
 */
export async function incrementPlayerXp(id: string, amount = 1): Promise<HydratedDocument<IPlayer>> {
  // const session = await Player.startSession();

  // session.startTransaction();

  const player = await Player.findOne({ id }); //.session(session);

  if (!player) {
    // await session.abortTransaction();
    throw new Error("player not found");
  }

  player.xp += amount;

  while (true) {
    const required = getNextLevelRequiredXp(player.level);

    if (player.xp < required) break;

    player.level++;
    player.xp -= required;
  }

  await player.save();

  // await session.commitTransaction();
  // await session.endSession();

  return player;
}

export function getNextLevelRequiredXp(level: number): number {
  return Math.floor(Math.pow(20 * level, 0.812) + 30);
}

export function getTreeXp(size: number): number {
  return Math.floor(Math.pow(size * 0.05 + 5, 1.08));
}
