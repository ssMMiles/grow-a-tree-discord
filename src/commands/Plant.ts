import {
  EmbedBuilder,
  ISlashCommand,
  MessageBuilder,
  SimpleError,
  SlashCommandBuilder,
  SlashCommandContext,
  SlashCommandStringOption
} from "interactions.ts";
import { Guild } from "../models/Guild";

export class Plant implements ISlashCommand {
  public builder = new SlashCommandBuilder("plant", "Plant a tree for your server.").addStringOption(
    new SlashCommandStringOption("name", "A name for your server's tree.").setRequired(true)
  );

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    if (!ctx.interaction.guild_id) ctx.reply(SimpleError("Guild ID missing."));

    const name = ctx.options.get("name");
    if (!name) return ctx.reply(SimpleError("Name not found."));

    new Guild({ id: ctx.interaction.guild_id, name: name.value }).save();

    return ctx.reply(
      new MessageBuilder().addEmbed(new EmbedBuilder().setTitle(`You planted \`\`${name.value}\`\` in your server!`))
    );
  };

  public components = [];
}
