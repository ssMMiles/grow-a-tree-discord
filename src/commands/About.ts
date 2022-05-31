import { EmbedBuilder, ISlashCommand, MessageBuilder, SlashCommandBuilder, SlashCommandContext } from "interactions.ts";

export class About implements ISlashCommand {
  public builder = new SlashCommandBuilder("about", "Some information about the bot.");

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    return ctx.reply(
      new MessageBuilder(
        new EmbedBuilder(
          "About The Bot",
          `
          <@972637072991068220> is a chill clicker game that lets you plant and name a community tree for your Discord server, and watch it grow as your members take turns watering it :)

          A tree cannot be watered by the same person twice, and will take longer to grow as it gets taller. Taller trees also grant more XP, but might get competitive in large servers.

          Compete with your friends or work together and try to grow your tree into one of the tallest in the forest!
          
          You can invite it by clicking on its profile, or by clicking the link below. After that, use \`\`/plant\`\` and enjoy!
          
          [ToS](https://rocksolidrobots.net/terms-of-service) | [Privacy Policy](https://rocksolidrobots.net/privacy-policy) | [Discord Support](https://rocksolidrobots.net/discord) | [Invite The Bot](https://rocksolidrobots.net/grow-a-tree) | [Vote For Us!](https://top.gg/bot/972637072991068220/vote)`
        ).setFooter({
          text: `This bot is a part of the RockSolidRobots network, find more from us at rocksolidrobots.net`
        })
      )
    );
  };
}
