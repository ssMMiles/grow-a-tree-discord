import {
  ActionRowBuilder,
  Button,
  ButtonBuilder,
  ButtonContext,
  ButtonStyle,
  CommandGroupBuilder,
  EmbedBuilder,
  ICommandGroup,
  MessageBuilder,
  SlashCommandContext,
  SubcommandOption
} from "interactions.ts";

export class Config implements ICommandGroup {
  public builder = new CommandGroupBuilder("config", "Manage your settings.").addSubcommands(
    new SubcommandOption("xp-messages", "Whether to display XP messages after watering a tree.")
  );

  public handlers = {
    "xp-messages": {
      handler: async (ctx: SlashCommandContext) => {
        await ctx.reply(await buildMessage(ctx));
      }
    }
  };

  public components = [
    new Button(
      "toggleXpMessages",
      new ButtonBuilder().setStyle(ButtonStyle.Primary),
      async (ctx: ButtonContext<never>) => {
        ctx.player.notifyXp = !ctx.player.notifyXp;

        await ctx.player.save();

        await ctx.reply(await buildMessage(ctx));
      }
    )
  ];
}

async function buildMessage(ctx: SlashCommandContext | ButtonContext<never>): Promise<MessageBuilder> {
  return new MessageBuilder(
    new EmbedBuilder()
      .setTitle("XP Notifications")
      .setDescription(
        `Whether to tell you how much XP was gained from watering a tree.\n\nCurrent: **${
          ctx.player.notifyXp ? "Enabled" : "Disabled"
        }**`
      )
  )
    .addComponents(
      new ActionRowBuilder([
        ((await ctx.createComponent("toggleXpMessages")) as ButtonBuilder).setEmoji({
          name: ctx.player.notifyXp ? "🔕" : "🔔"
        })
      ])
    )
    .setEphemeral(true);
}
