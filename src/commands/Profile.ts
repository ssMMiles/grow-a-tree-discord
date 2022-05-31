import {
  ActionRowBuilder,
  Button,
  ButtonBuilder,
  ButtonContext,
  EmbedBuilder,
  ISlashCommand,
  IUserCommand,
  MessageBuilder,
  SimpleEmbed,
  SlashCommandBuilder,
  SlashCommandContext,
  SlashCommandUserOption,
  UserCommandBuilder,
  UserCommandContext
} from "interactions.ts";
import { Player } from "../models/Player";
import { getNextLevelRequiredXp } from "../util/leveling";

type State = {
  id: string;
  nick: string;
};

export class UserContextProfile implements IUserCommand {
  public builder = new UserCommandBuilder("View Profile");

  public handler = async (ctx: UserCommandContext) => {
    return ctx.reply(await buildProfileMessage(ctx));
  };

  public components = [];
}

export class Profile implements ISlashCommand {
  public builder = new SlashCommandBuilder("profile", "View a user's contributions to the tree.")
    .addUserOption(new SlashCommandUserOption("target", "User whose profile you want to view."))
    .setDMEnabled(false);

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    return ctx.reply(await buildProfileMessage(ctx));
  };

  public components = [
    new Button(
      "refresh",
      new ButtonBuilder().setEmoji({ name: "🔄" }).setStyle(1),
      async (ctx: ButtonContext<State>): Promise<void> => {
        return ctx.reply(await buildProfileMessage(ctx));
      }
    )
  ];
}

async function buildProfileMessage(
  ctx: SlashCommandContext | ButtonContext<State> | UserCommandContext
): Promise<MessageBuilder> {
  if (!ctx.game)
    return new MessageBuilder().setContent("Use /plant to plant a tree for your server first.").setEphemeral(true);

  let nick: string, id: string;

  if (ctx instanceof UserCommandContext) {
    id = ctx.target.user.id;
    nick = ctx.target?.member?.nick ?? ctx.target.user.username;
  } else if (ctx instanceof SlashCommandContext || !ctx.state) {
    const target =
      ctx instanceof SlashCommandContext && ctx.hasOption("target")
        ? ctx.interaction.data.resolved?.users?.[ctx.getStringOption("target").value]
        : undefined;

    id = target ? target.id : ctx.user.id;
    nick =
      ctx instanceof SlashCommandContext && target
        ? ctx.interaction.data?.resolved?.members?.[id]?.nick ?? target.username
        : ctx.interaction.member?.nick ?? ctx.user.username;
  } else {
    id = ctx.state.id;
    nick = ctx.state.nick;
  }

  const player = await Player.findOne({ id });

  if (!player) return SimpleEmbed("This person hasn't used the bot yet, send them a link!");

  const contributor = ctx.game.contributors.find((contributor) => contributor.userId === id);

  let refreshButton;
  if (ctx instanceof UserCommandContext || ctx instanceof SlashCommandContext) {
    refreshButton = await ctx.createGlobalComponent("profile.refresh", { id, nick });
  } else {
    ctx.parentCommand = undefined;
    refreshButton = await ctx.createComponent("profile.refresh", { id, nick });
  }

  return new MessageBuilder(
    new EmbedBuilder(
      `${nick}'s Profile`,
      `Level: **${player.level}**\nXP: ${player.xp}/${getNextLevelRequiredXp(player.level)}\n\n${
        ctx.user.id === id ? `You've` : `This player has`
      } ${
        contributor
          ? `watered \`\`${ctx.game.name}\`\` ${contributor.count} times and are ranked #${
              ctx.game.contributors
                .sort((a, b) => b.count - a.count)
                .findIndex((contributor) => contributor.userId === id) + 1
            }/${ctx.game.contributors.length} in this community.`
          : "not yet watered the tree."
      }`
    )
  ).addComponents(new ActionRowBuilder([refreshButton]));
}
