import { model, Schema } from "mongoose";

interface IGuild {
  id: string;

  name: string;
  size: number;

  lastWateredBy: string;
  lastWateredAt: number;

  contributors: IContributor[];
}

interface IContributor {
  userId: string;
  count: number;
}

const ContributorSchema = new Schema<IContributor>({
  userId: { type: String, required: true },
  count: { type: Number, required: true, default: 1 }
});

const GuildSchema = new Schema<IGuild>({
  id: { type: String, required: true, unique: true },

  name: { type: String, required: true },
  size: { type: Number, required: true, default: 1 },

  lastWateredBy: { type: String, required: false },
  lastWateredAt: { type: Number, required: false },

  contributors: { type: [ContributorSchema], required: true, default: [] }
});

const Contributor = model<IContributor>("Contributor", ContributorSchema);
const Guild = model<IGuild>("Guild", GuildSchema);

export { Guild, GuildSchema, Contributor, ContributorSchema, IGuild, IContributor };
