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
import { getTreeHeight } from "../util/tree-height";

type LeaderboardButtonState = {
  page: number;
};

const MEDAL_EMOJIS = ["🥇", "🥈", "🥉"];

export class Forest implements ISlashCommand {
  public builder = new SlashCommandBuilder(
    "forest",
    "The tallest trees in the forest. (Global Leaderboard)"
  ).addIntegerOption(
    new SlashCommandIntegerOption("page", "Leaderboard page to display.").setMinValue(1).setMaxValue(10)
  );

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    return ctx.reply(await buildLeaderboardMessage(ctx));
  };

  public components = [
    new Button(
      "refresh",
      new ButtonBuilder().setEmoji({ name: "🔄" }).setStyle(2),
      async (ctx: ButtonContext): Promise<void> => {
        return ctx.reply(await buildLeaderboardMessage(ctx));
      }
    ),
    new Button(
      "back",
      new ButtonBuilder().setEmoji({ name: "◀️" }).setStyle(2),
      async (ctx: ButtonContext<LeaderboardButtonState>): Promise<void> => {
        if (!ctx.state) return;

        ctx.state.page--;
        return ctx.reply(await buildLeaderboardMessage(ctx));
      }
    ),
    new Button(
      "next",
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
      ? { page: ctx.hasOption("page") ? Number(ctx.getIntegerOption("page").value) : 1 }
      : (ctx.state as LeaderboardButtonState);

  let description = "The tallest trees in all the Discord servers.\n\n";

  const start = (state.page - 1) * 10;

  const trees = await Guild.find().sort({ size: -1, id: 1 }).skip(start).limit(11);

  if (trees.length === 0) return SimpleError("This page is empty.");

  for (let i = 0; i < 10; i++) {
    if (i === trees.length) break;
    const pos = i + start;

    const tree = trees[i];

    description += `${pos < 3 ? `${MEDAL_EMOJIS[i]}` : `\`\`${pos + 1}${pos < 9 ? " " : ""}\`\``} - \`\`${
      tree.name
    }\`\` - ${getTreeHeight(tree)}ft\n`;
  }

  const actionRow = new ActionRowBuilder([await ctx.createComponent("refresh", state)]);

  const backButton = await ctx.createComponent("back", state);
  const nextButton = await ctx.createComponent("next", state);

  if (state.page <= 1) {
    backButton.setDisabled(true);
  }

  if (trees.length <= 10) {
    nextButton.setDisabled(true);
  }

  actionRow.addComponents(backButton, nextButton);

  return new MessageBuilder(new EmbedBuilder().setTitle("Forest").setDescription(description)).addComponents(actionRow);
}
