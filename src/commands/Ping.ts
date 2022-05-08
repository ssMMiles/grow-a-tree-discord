import {
  ActionRowBuilder,
  Button,
  ButtonBuilder,
  ButtonContext,
  EmbedBuilder,
  ISlashCommand,
  MessageBuilder,
  SlashCommandBuilder,
  SlashCommandContext
} from "interactions.ts";

type TestButtonState = {
  ping: boolean;
};

export class Ping implements ISlashCommand {
  public builder = new SlashCommandBuilder("ping", "Simple ping command.");

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    const button = await ctx.manager.components.createInstance("ping.pong", { ping: false });

    return ctx.reply(
      new MessageBuilder()
        .addEmbed(new EmbedBuilder().setTitle("Pong!"))
        .addComponents(new ActionRowBuilder().addComponents(button))
    );
  };

  public components = [
    new Button(
      "ping.pong",
      new ButtonBuilder().setEmoji({ name: "🏓" }).setStyle(1),
      async (ctx: ButtonContext<TestButtonState>): Promise<void> => {
        if (!ctx.state) throw new Error("State missing.");

        ctx.reply(
          new MessageBuilder()
            .addEmbed(new EmbedBuilder().setTitle(ctx.state.ping ? "Pong!" : "Ping!"))
            .addComponents(
              new ActionRowBuilder().addComponents(
                await ctx.manager.components.createInstance("ping.pong", { ping: !ctx.state.ping })
              )
            )
        );
      }
    )
  ];
}
