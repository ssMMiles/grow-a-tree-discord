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
import { Player } from "../models/Player";

type LeaderboardButtonState = {
  page: number;
  global: boolean;
};

const MEDAL_EMOJIS = ["🥇", "🥈", "🥉"];

export class Leaderboard implements ISlashCommand {
  public builder = new SlashCommandBuilder(
    "leaderboard",
    "See a leaderboard of contributors to this server's tree. (Community Leaderboard)"
  )
    .addIntegerOption(
      new SlashCommandIntegerOption("page", "Leaderboard page to display.").setMinValue(1).setMaxValue(10)
    )
    .setDMEnabled(false);

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    if (ctx.game === null)
      return ctx.reply(SimpleError("Use /plant to plant a tree for your server first.").setEphemeral(true));

    return ctx.reply(await buildLeaderboardMessage(ctx));
  };

  public components = [
    new Button(
      "refresh",
      new ButtonBuilder().setEmoji({ name: "🔄" }).setStyle(2),
      async (ctx: ButtonContext<LeaderboardButtonState>): Promise<void> => {
        if (!ctx.state) return;

        return ctx.reply(await buildLeaderboardMessage(ctx));
      }
    ),
    new Button(
      "toggleGlobal",
      new ButtonBuilder().setEmoji({ name: "🌎" }).setStyle(2),
      async (ctx: ButtonContext<LeaderboardButtonState>): Promise<void> => {
        if (!ctx.state) return;

        ctx.state.global = !ctx.state.global;
        ctx.state.page = 1;

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
  if (ctx.game === null) throw new Error("Game data missing.");

  const state: LeaderboardButtonState =
    ctx instanceof SlashCommandContext
      ? { page: ctx.hasOption("page") ? Number(ctx.getIntegerOption("page").value) : 1, global: false }
      : (ctx.state as LeaderboardButtonState);

  if (state.global) return await buildGlobalLeaderboardMessage(ctx, state);

  let description = "";

  const contributors = ctx.game.contributors.sort((a, b) => b.count - a.count);

  if (contributors.length === 0) return SimpleError("This page is empty.");

  const start = (state.page - 1) * 10;

  for (let i = start; i < start + 10; i++) {
    if (i === contributors.length) {
      if (i === start) description = `This page is empty.`;
      break;
    }

    const contributor = contributors[i];

    description += `${i < 3 ? `${MEDAL_EMOJIS[i]}` : `\`\`${i + 1}${i < 9 ? " " : ""}\`\``} - 💧${
      contributor.count
    } <@${contributor.userId}>\n`;
  }

  const actionRow = new ActionRowBuilder([await ctx.createComponent("refresh", state)]);

  const toggleGlobal = (await ctx.createComponent("toggleGlobal", state)) as ButtonBuilder;

  const backButton = await ctx.createComponent("back", state);
  const nextButton = await ctx.createComponent("next", state);

  if (state.page <= 1) {
    backButton.setDisabled(true);
  }

  if (state.page >= Math.ceil(contributors.length / 10)) {
    nextButton.setDisabled(true);
  }

  actionRow.addComponents(toggleGlobal, backButton, nextButton);

  return new MessageBuilder(
    new EmbedBuilder().setTitle("Greatest Gardeners").setDescription(description)
  ).addComponents(actionRow);
}

async function buildGlobalLeaderboardMessage(
  ctx: SlashCommandContext | ButtonContext<LeaderboardButtonState>,
  state: LeaderboardButtonState
): Promise<MessageBuilder> {
  if (ctx.game === null) throw new Error("Game data missing.");

  let description = "";

  const start = (state.page - 1) * 10;

  const players = await Player.find().sort({ level: -1 }).skip(start).limit(11);

  if (players.length === 0) return SimpleError("This page is empty.");

  for (let i = 0; i < 10; i++) {
    if (i === players.length) break;
    const pos = i + start;

    const player = players[i];

    description += `${pos < 3 ? `${MEDAL_EMOJIS[i]}` : `\`\`${pos + 1}${pos < 9 ? " " : ""}\`\``} - Level ${
      player.level
    } <@${player.id}>\n`;
  }

  const actionRow = new ActionRowBuilder([await ctx.createComponent("refresh", state)]);

  const toggleGlobal = (await ctx.createComponent("toggleGlobal", state)) as ButtonBuilder;

  toggleGlobal.setEmoji({ name: "🌳" });

  const backButton = await ctx.createComponent("back", state);
  const nextButton = await ctx.createComponent("next", state);

  if (state.page <= 1) {
    backButton.setDisabled(true);
  }

  if (players.length <= 10) {
    nextButton.setDisabled(true);
  }

  actionRow.addComponents(toggleGlobal, backButton, nextButton);

  return new MessageBuilder(new EmbedBuilder("Greatest Gardeners (Global)", description)).addComponents(actionRow);
}
