import {
  ActionRowBuilder,
  Button,
  ButtonBuilder,
  ButtonContext,
  EmbedBuilder,
  ISlashCommand,
  MessageBuilder,
  SimpleError,
  SlashCommandBuilder,
  SlashCommandContext,
  SlashCommandIntegerOption
} from "interactions.ts";
import { Guild } from "../models/Guild";

type LeaderboardButtonState = {
  page: number;
};

const MEDAL_EMOJIS = ["🥇", "🥈", "🥉"];

export class Forest implements ISlashCommand {
  public builder = new SlashCommandBuilder("forest", "See the tallest trees in the whole forest.").addIntegerOption(
    new SlashCommandIntegerOption("page", "Leaderboard page to display.").setMinValue(1).setMaxValue(10)
  );

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
    ),
    new Button(
      "forest.back",
      new ButtonBuilder().setEmoji({ name: "◀️" }).setStyle(2),
      async (ctx: ButtonContext<LeaderboardButtonState>): Promise<void> => {
        if (!ctx.state) return;

        ctx.state.page--;
        return ctx.reply(await buildLeaderboardMessage(ctx));
      }
    ),
    new Button(
      "forest.next",
      new ButtonBuilder().setEmoji({ name: "▶️" }).setStyle(2),
      async (ctx: ButtonContext<LeaderboardButtonState>): Promise<void> => {
        if (!ctx.state) return;

        ctx.state.page++;
        return ctx.reply(await buildLeaderboardMessage(ctx));
      }
    )
  ];
}

async function buildLeaderboardMessage(
  ctx: SlashCommandContext | ButtonContext<LeaderboardButtonState>
): Promise<MessageBuilder> {
  const state: LeaderboardButtonState =
    ctx instanceof SlashCommandContext
      ? { page: ctx.options.has("page") ? Number(ctx.options.get("page")?.value) : 1 }
      : (ctx.state as LeaderboardButtonState);

  let description = `*The tallest trees of all.*\n\n`;

  const start = (state.page - 1) * 10;

  const trees = await Guild.find().sort({ size: -1 }).skip(start).limit(11);

  if (trees.length === 0) return SimpleError("This page is empty.");

  for (let i = 0; i < 10; i++) {
    if (i === trees.length) break;
    const pos = i + start;

    const tree = trees[i];

    description += `${pos < 3 ? `${MEDAL_EMOJIS[i]}` : `\`\`${pos + 1}${pos < 9 ? " " : ""}\`\``} - \`\`${
      tree.name
    }\`\` - ${tree.size}ft\n`;
  }

  const actionRow = new ActionRowBuilder().addComponents(
    await ctx.manager.components.createInstance("forest.refresh", state)
  );

  if (state.page > 1) {
    actionRow.addComponents(await ctx.manager.components.createInstance("forest.back", state));
  }

  if (trees.length > 10) {
    actionRow.addComponents(await ctx.manager.components.createInstance("forest.next", state));
  }

  return new MessageBuilder()
    .addEmbed(new EmbedBuilder().setTitle("Forest").setDescription(description))
    .addComponents(actionRow);
}
