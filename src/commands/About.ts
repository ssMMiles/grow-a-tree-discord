import { EmbedBuilder, ISlashCommand, MessageBuilder, SlashCommandBuilder, SlashCommandContext } from "interactions.ts";

export class About implements ISlashCommand {
  public builder = new SlashCommandBuilder("about", "Some information about the bot.");

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    return ctx.reply(
      new MessageBuilder().addEmbed(
        new EmbedBuilder().setTitle("About Us").setDescription(
          `
          <@972637072991068220> lets you plant a tree in your Discord server, water it, and watch it grow.

          The tree cannot be watered by the same person twice, and takes longer to grow as its size increases. Your community must therefore co-operate to always keep it growing and compete with the tallest trees on the leaderboard.
          
          You can invite it by clicking on its profile, or by [clicking here :)](https://ssmmiles.com/trees) Enjoy!`
        )
      )
    );
  };

  public components = [];
}
