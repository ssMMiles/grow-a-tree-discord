import {
  ActionRowBuilder,
  Button,
  ButtonBuilder,
  ButtonContext,
  EmbedBuilder,
  ISlashCommand,
  MessageBuilder,
  SlashCommandBuilder,
  SlashCommandContext
} from "interactions.ts";
import { Guild } from "../models/Guild";

export class Forest implements ISlashCommand {
  public builder = new SlashCommandBuilder("forest", "See the tallest trees in the whole forest.");

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    return ctx.reply(await buildLeaderboardMessage(ctx));
  };

  public components = [
    new Button(
      "forest.refresh",
      new ButtonBuilder().setEmoji({ name: "🔄" }).setStyle(2),
      async (ctx: ButtonContext): Promise<void> => {
        return ctx.reply(await buildLeaderboardMessage(ctx));
      }
    )
  ];
}

async function buildLeaderboardMessage(ctx: SlashCommandContext | ButtonContext): Promise<MessageBuilder> {
  let description = "";

  const contributors = await Guild.find().sort({ size: -1 }).limit(10);

  for (let i = 0; i < 10; i++) {
    if (i === contributors.length) break;

    const contributor = contributors[i];

    description += `${i < 3 ? `**${i + 1}**` : `${i + 1}`}. ${contributor.size}ft \`\`${contributor.name}\`\`>\n`;
  }

  return new MessageBuilder()
    .addEmbed(new EmbedBuilder().setTitle("Forest").setDescription(description))
    .addComponents(new ActionRowBuilder().addComponents(await ctx.manager.components.createInstance("forest.refresh")));
}
