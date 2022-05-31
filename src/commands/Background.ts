import {
  ButtonContext,
  EmbedBuilder,
  ISlashCommand,
  MessageBuilder,
  PermissionBits,
  SimpleEmbed,
  SlashCommandBuilder,
  SlashCommandContext
} from "interactions.ts";

const Backgrounds = {
  Base: {
    ground: 1,
    sky: 2,
    edgespace: 3
  }
};

export class Background implements ISlashCommand {
  public builder = new SlashCommandBuilder("background", "Change your tree's background.")
    .setDMEnabled(false)
    .addRequiredPermissions(PermissionBits.ADMINISTRATOR);

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    return ctx.reply(await buildBackgroundMenu(ctx));
  };

  public components = [];
}

async function buildBackgroundMenu(ctx: SlashCommandContext | ButtonContext): Promise<MessageBuilder> {
  if (ctx.game === null) return SimpleEmbed("Use /plant to plant a tree for your server first.");

  const background = ctx.game.background;
  const style = ctx.game.backgroundStyle;

  const backgrounds = {
    Ground: 0,
    Sky: 5,
    SpaceEdge: 1000
  };

  const backgroundNames = Object.keys(backgrounds);
  const position = backgroundNames.indexOf(background);

  const embed = new EmbedBuilder();

  return new MessageBuilder();
}
