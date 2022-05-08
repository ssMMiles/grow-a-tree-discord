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
          const timeout = ctx.timeouts.get(ctx.interaction.message.id);
          if (timeout) clearTimeout(timeout);

          ctx.reply(
            SimpleError("You watered this tree last, you must let someone else water it first.").setEphemeral(true)
          );

          ctx.timeouts.set(
            ctx.interaction.message.id,
            setTimeout(async () => {
              ctx.timeouts.delete(ctx.interaction?.message?.id ?? "broken");

              await ctx.edit(await buildTreeDisplayMessage(ctx));
            }, 3000)
          );

          return;
        }

        const wateringInterval = getWateringInterval(ctx.game.size),
          time = Math.floor(Date.now() / 1000);
        if (ctx.game.lastWateredAt + wateringInterval > time) {
          const timeout = ctx.timeouts.get(ctx.interaction.message.id);
          if (timeout) clearTimeout(timeout);

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

          ctx.timeouts.set(
            ctx.interaction.message.id,
            setTimeout(async () => {
              ctx.timeouts.delete(ctx.interaction?.message?.id ?? "broken");

              await ctx.edit(await buildTreeDisplayMessage(ctx));
            }, 3000)
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

  const message = new MessageBuilder().addComponents(
    new ActionRowBuilder().addComponents(
      await ctx.manager.components.createInstance("tree.grow"),
      await ctx.manager.components.createInstance("tree.refresh")
    )
  );

  const canBeWateredAt = ctx.game.lastWateredAt + getWateringInterval(ctx.game.size);

  const embed = new EmbedBuilder().setTitle(ctx.game.name);

  if (canBeWateredAt < Date.now() / 1000) {
    embed.setDescription(
      `**Your tree is ${ctx.game.size}ft tall.**\n\nLast watered by: <@${ctx.game.lastWateredBy}>\n**Ready to be watered!**`
    );
  } else {
    embed.setDescription(
      `**Your tree is ${ctx.game.size}ft tall.**\n\nLast watered by: <@${ctx.game.lastWateredBy}>\n*Your tree is growing, come back <t:${canBeWateredAt}:R>.*`
    );

    if (ctx.interaction.message && !ctx.timeouts.has(ctx.interaction.message.id)) {
      ctx.timeouts.set(
        ctx.interaction.message.id,
        setTimeout(async () => {
          ctx.timeouts.delete(ctx.interaction?.message?.id ?? "broken");

          await ctx.edit(await buildTreeDisplayMessage(ctx));
        }, canBeWateredAt * 1000 - Date.now())
      );
    }
  }

  message.addEmbed(embed);

  return message;
}
