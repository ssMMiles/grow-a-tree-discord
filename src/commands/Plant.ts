import {
  EmbedBuilder,
  ISlashCommand,
  MessageBuilder,
  SimpleError,
  SlashCommandBuilder,
  SlashCommandContext,
  SlashCommandStringOption
} from "interactions.ts";
import CommandPermissions from "interactions.ts/dist/builders/commands/permissions/CommandPermissions";
import { Guild } from "../models/Guild";
import { validateTreeName } from "../util/validate-tree-name";

export class Plant implements ISlashCommand {
  public builder = new SlashCommandBuilder("plant", "Plant a tree for your server.")
    .addStringOption(new SlashCommandStringOption("name", "A name for your server's tree.").setRequired(true))
    .setDMEnabled(false)
    .addRequiredPermissions(CommandPermissions.ADMINISTRATOR);

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    if (ctx.game !== null)
      return ctx.reply(`A tree has already been planted in this server called \`\`${ctx.game.name}\`\`.`);
    if (ctx.interaction.guild_id === undefined) return ctx.reply(SimpleError("Guild ID missing."));

    const name = ctx.options.get("name")?.value as string | undefined;
    if (name === undefined) return ctx.reply(SimpleError("Name not found."));

    if (!validateTreeName(name))
      return ctx.reply(
        SimpleError(
          "Your tree name must be 1-36 characters, and contain only alphanumeric characters, hyphens, and apostrophes."
        )
      );

    await new Guild({
      id: ctx.interaction.guild_id,

      name: name,

      lastWateredAt: Math.floor(Date.now() / 1000),
      lastWateredBy: ctx.user.id,

      pieces: [0],

      contributors: [
        {
          userId: ctx.user.id,
          count: 1
        }
      ]
    }).save();

    return ctx.reply(
      new MessageBuilder().addEmbed(new EmbedBuilder().setTitle(`You planted \`\`${name}\`\` in your server!`))
    );
  };

  public components = [];
}
