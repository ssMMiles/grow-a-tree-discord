import { model, Schema } from "mongoose";

interface IPlayer {
  id: string;

  level: number;
  xp: number;

  notifyXp: boolean;
}

const PlayerSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },

  level: { type: Number, required: true, default: 1 },
  xp: { type: Number, required: true, default: 0 },

  notifyXp: { type: Boolean, required: true, default: false }
});

const Player = model<IPlayer>("Player", PlayerSchema);

export { Player, PlayerSchema, IPlayer };
