import {
  ActionRowBuilder,
  Button,
  ButtonBuilder,
  ButtonContext,
  EmbedBuilder,
  ISlashCommand,
  MessageBuilder,
  SimpleError,
  SlashCommandBuilder,
  SlashCommandContext
} from "interactions.ts";
import { getWateringInterval } from "../util/watering-inteval";

export class Tree implements ISlashCommand {
  public builder = new SlashCommandBuilder("tree", "Display your server's tree.");

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    if (!ctx.game) return ctx.reply("Use /plant to plant a tree for your server first.");

    return ctx.reply(await buildTreeDisplayMessage(ctx));
  };

  public components = [
    new Button(
      "tree.grow",
      new ButtonBuilder().setEmoji({ name: "💧" }).setStyle(1),
      async (ctx: ButtonContext): Promise<void> => {
        if (!ctx.game) throw new Error("Game data missing.");

        if (ctx.game.lastWateredBy === ctx.user.id) {
          ctx.reply(
            SimpleError("You watered this tree last, you must let someone else water it first.").setEphemeral(true)
          );

          return;
        }

        const wateringInterval = getWateringInterval(ctx.game.size),
          time = Math.floor(Date.now() / 1000);
        if (ctx.game.lastWateredAt + wateringInterval > time) {
          ctx.reply(
            new MessageBuilder().addEmbed(
              new EmbedBuilder()
                .setTitle(`\`\`${ctx.game.name}\`\` is growing already.`)
                .setDescription(
                  `It was recently watered by <@${ctx.game.lastWateredBy}>.\n\nYou can next water it: <t:${
                    ctx.game.lastWateredAt + wateringInterval
                  }:R>`
                )
            )
          );

          return;
        }

        ctx.game.lastWateredAt = time;
        ctx.game.lastWateredBy = ctx.user.id;

        ctx.game.size++;

        const contributor = ctx.game.contributors.find((contributor) => contributor.userId === ctx.user.id);

        if (contributor) {
          contributor.count++;
        } else {
          ctx.game.contributors.push({ userId: ctx.user.id, count: 1 });
        }

        await ctx.game.save();

        return ctx.reply(await buildTreeDisplayMessage(ctx));
      }
    ),
    new Button(
      "tree.refresh",
      new ButtonBuilder().setEmoji({ name: "🔄" }).setStyle(2),
      async (ctx: ButtonContext): Promise<void> => {
        return ctx.reply(await buildTreeDisplayMessage(ctx));
      }
    )
  ];
}

async function buildTreeDisplayMessage(ctx: SlashCommandContext | ButtonContext): Promise<MessageBuilder> {
  if (!ctx.game) throw new Error("Game data missing.");

  const message = new MessageBuilder();

  message
    .addEmbed(
      new EmbedBuilder().setTitle("Nice Tree").setDescription(`\`\`${ctx.game.name}\`\` is ${ctx.game.size}ft tall.`)
    )
    .addComponents(
      new ActionRowBuilder().addComponents(
        await ctx.manager.components.createInstance("tree.grow"),
        await ctx.manager.components.createInstance("tree.refresh")
      )
    );

  return message;
}
