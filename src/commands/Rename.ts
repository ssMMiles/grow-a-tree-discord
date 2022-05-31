import {
  ISlashCommand,
  PermissionBits,
  SimpleEmbed,
  SimpleError,
  SlashCommandBuilder,
  SlashCommandContext,
  SlashCommandStringOption
} from "interactions.ts";
import { validateTreeName } from "../util/validate-tree-name";

export class Rename implements ISlashCommand {
  public builder = new SlashCommandBuilder("rename", "Rename your server's tree.")
    .addStringOption(new SlashCommandStringOption("name", "Your tree's new name.").setRequired(true))
    .setDMEnabled(false)
    .addRequiredPermissions(PermissionBits.ADMINISTRATOR);

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    if (ctx.game === null) return ctx.reply("Use /plant to plant a tree for your server first.");
    if (ctx.interaction.guild_id === undefined) return ctx.reply(SimpleError("Guild ID missing."));

    const name = ctx.getStringOption("name").value;

    if (!validateTreeName(name))
      return ctx.reply(
        SimpleError(
          "Your tree name must be 1-36 characters, and contain only alphanumeric characters, hyphens, and apostrophes."
        )
      );

    ctx.game.name = name;
    await ctx.game.save();

    return ctx.reply(SimpleEmbed(`You server's tree is now called \`\`${name}\`\`!`));
  };
}
