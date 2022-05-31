import { HydratedDocument } from "mongoose";
import { ITree } from "../models/Guild";
import { getWateringInterval } from "./watering-interval";

export function getTreeHeight(tree: HydratedDocument<ITree>) {
  const growthTime = getWateringInterval(tree.pieces.length - 1);

  const canBeWateredAt = tree.lastWateredAt + growthTime;
  const time = Math.floor(Date.now() / 1000);

  const growing = canBeWateredAt > time;

  return growing ? tree.size - Math.floor(((canBeWateredAt - time) / growthTime) * 10) / 10 : tree.size;
}
