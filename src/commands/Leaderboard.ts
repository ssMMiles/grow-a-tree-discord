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

export class Leaderboard implements ISlashCommand {
  public builder = new SlashCommandBuilder("leaderboard", "See a leaderboard of contributors to this server's tree.");

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    if (!ctx.game) return ctx.reply("Use /plant to plant a tree for your server first.");

    return ctx.reply(await buildLeaderboardMessage(ctx));
  };

  public components = [
    new Button(
      "leaderboard.refresh",
      new ButtonBuilder().setEmoji({ name: "🔄" }).setStyle(2),
      async (ctx: ButtonContext): Promise<void> => {
        return ctx.reply(await buildLeaderboardMessage(ctx));
      }
    )
  ];
}

async function buildLeaderboardMessage(ctx: SlashCommandContext | ButtonContext): Promise<MessageBuilder> {
  if (!ctx.game) throw new Error("Game data missing.");

  let description = "";

  const contributors = ctx.game.contributors.sort((a, b) => b.count - a.count);

  for (let i = 0; i < 10; i++) {
    if (i === contributors.length) break;

    const contributor = contributors[i];

    description += `${i < 3 ? `**${i + 1}**` : `${i + 1}`}. #${contributor.count} <@${contributor.userId}>\n`;
  }

  return new MessageBuilder()
    .addEmbed(new EmbedBuilder().setTitle("Leaderboard").setDescription(description))
    .addComponents(
      new ActionRowBuilder().addComponents(await ctx.manager.components.createInstance("leaderboard.refresh"))
    );
}
