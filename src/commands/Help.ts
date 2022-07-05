import { EmbedBuilder, ISlashCommand, MessageBuilder, SlashCommandBuilder, SlashCommandContext } from "interactions.ts";

export class Help implements ISlashCommand {
  public builder = new SlashCommandBuilder("help", "Get support with using the bot.");

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    return ctx.reply(
      new MessageBuilder(
        new EmbedBuilder(
          "Help",
          `
          If you're just curious about how the game works, check the /about command for a basic run-down. 
          
          If that's not enough, [click here](https://rocksolidrobots.net/discord) to visit our Discord server where you can get announcements and support for any bots in the RockSolidRobots network.`
        )
      ).setEphemeral(true)
    );
  };
}
