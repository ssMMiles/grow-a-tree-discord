import humanizeDuration = require("humanize-duration");
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
import { renderTree } from "../util/image-generation";
import { getNextLevelRequiredXp, getTreeXp, incrementPlayerXp } from "../util/leveling";
import { generateNextSegment } from "../util/tree-generation";
import { getTreeHeight } from "../util/tree-height";
import { getTreeAge, getWateringInterval } from "../util/watering-interval";

export class Tree implements ISlashCommand {
  public builder = new SlashCommandBuilder("tree", "Display your server's tree.").setDMEnabled(false);

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    if (ctx.game === null) return ctx.reply("Use /plant to plant a tree for your server first.");

    await ctx.defer();

    ctx.interaction.message = await ctx.send(await buildTreeDisplayMessage(ctx));

    const growthTime = getWateringInterval(ctx.game.pieces.length - 1);
    const time = Math.floor(Date.now() / 1000);

    if (ctx.game.lastWateredAt + growthTime > time) {
      ctx.timeouts.set(
        ctx.interaction.message.id,
        setTimeout(async () => {
          try {
            await ctx.edit(await buildTreeDisplayMessage(ctx));
          } catch (err) {
            console.error(err);
          }
        }, (ctx.game.lastWateredAt + growthTime - time) * 1000)
      );
    }
  };

  public components = [
    new Button(
      "grow",
      new ButtonBuilder().setEmoji({ name: "💧" }).setStyle(1),
      async (ctx: ButtonContext): Promise<void> => {
        if (!ctx.game) throw new Error("Game data missing.");

        if (ctx.game.lastWateredBy === ctx.user.id) {
          const timeout = ctx.timeouts.get(ctx.interaction.message.id);
          if (timeout) clearTimeout(timeout);

          ctx.timeouts.set(
            ctx.interaction.message.id,
            setTimeout(async () => {
              try {
                await ctx.edit(await buildTreeDisplayMessage(ctx));
              } catch (err) {
                console.error(err);
              }
            }, 3000)
          );

          await ctx.reply(
            SimpleError("You watered this tree last, you must let someone else water it first.").setEphemeral(true)
          );

          return;
        }

        const wateringInterval = getWateringInterval(ctx.game.pieces.length - 1),
          time = Math.floor(Date.now() / 1000);

        if (ctx.game.lastWateredAt + wateringInterval > time) {
          const timeout = ctx.timeouts.get(ctx.interaction.message.id);
          if (timeout) clearTimeout(timeout);

          ctx.timeouts.set(
            ctx.interaction.message.id,
            setTimeout(async () => {
              try {
                await ctx.edit(await buildTreeDisplayMessage(ctx));
              } catch (err) {
                console.error(err);
              }
            }, 3000)
          );

          await ctx.reply(
            new MessageBuilder(
              new EmbedBuilder(
                `\`\`${ctx.game.name}\`\` is growing already.`,
                `It was recently watered by <@${ctx.game.lastWateredBy}>.\n\nYou can water it next: <t:${
                  ctx.game.lastWateredAt + wateringInterval
                }:R>`
              )
            )
          );

          return;
        }

        ctx.game.lastWateredAt = time;
        ctx.game.lastWateredBy = ctx.user.id;

        ctx.game.size = ctx.game.pieces.push(generateNextSegment(ctx.game));

        const contributor = ctx.game.contributors.find((contributor) => contributor.userId === ctx.user.id);

        if (contributor) {
          contributor.count++;
        } else {
          ctx.game.contributors.push({ userId: ctx.user.id, count: 1 });
        }

        if (ctx.game.size === 1000) ctx.game.background = "SpaceEdge";
        if (ctx.game.size === 6) ctx.game.background = "Sky";

        await ctx.game.save();

        await ctx.reply(await buildTreeDisplayMessage(ctx));

        const gainedXp = getTreeXp(ctx.game.size);
        const updatedPlayer = await incrementPlayerXp(ctx.user.id, gainedXp);

        const firstWater = ctx.player.level === 0 && ctx.player.xp === 0;

        if (ctx.player.notifyXp || firstWater) {
          const description = `Thanks for watering the tree! **\`\`+${gainedXp}XP\`\`**${
            updatedPlayer.level !== ctx.player.level ? `\n\nYou are now level **${updatedPlayer.level}**!` : ""
          }`;

          const embed = new EmbedBuilder()
            .setTitle(
              `Level ${updatedPlayer.level} - \`\`${updatedPlayer.xp}/${getNextLevelRequiredXp(
                updatedPlayer.level
              )}XP\`\``
            )
            .setDescription(description);

          if (firstWater) {
            embed.setFooter({
              text: "By default you'll only see level ups here, but if you'd like to see your XP when you water - Use /config xp-messages :)"
            });
          }

          await ctx.send(new MessageBuilder(embed).setEphemeral(true));

          return;
        }

        if (updatedPlayer.level !== ctx.player.level)
          await ctx.send(
            new MessageBuilder(
              new EmbedBuilder(`Congratulations! You are now level **${updatedPlayer.level}**!`)
            ).setEphemeral(true)
          );
      }
    ),
    new Button(
      "refresh",
      new ButtonBuilder().setEmoji({ name: "🔄" }).setStyle(2),
      async (ctx: ButtonContext): Promise<void> => {
        return ctx.reply(await buildTreeDisplayMessage(ctx));
      }
    )
  ];
}

export async function buildTreeDisplayMessage(
  ctx: SlashCommandContext | ButtonContext,
  starting = false
): Promise<MessageBuilder> {
  if (ctx.game === null) throw new Error("Game data missing.");

  const message = new MessageBuilder().addComponents(
    new ActionRowBuilder().addComponents(await ctx.createComponent("grow"), await ctx.createComponent("refresh"))
  );

  const growthTime = getWateringInterval(ctx.game.pieces.length - 1);

  const canBeWateredAt = ctx.game.lastWateredAt + growthTime;
  const time = Math.floor(Date.now() / 1000);

  const timeout = ctx.timeouts.get(ctx.interaction?.message?.id ?? ctx.interaction.id);

  if (timeout !== undefined && ctx.interaction?.message?.id) {
    clearTimeout(timeout);
    ctx.timeouts.delete(ctx.interaction.message.id);
  }

  if (canBeWateredAt > time && ctx.interaction?.message?.id) {
    ctx.timeouts.set(
      ctx.interaction.message.id,
      setTimeout(async () => {
        try {
          await ctx.edit(await buildTreeDisplayMessage(ctx));
        } catch (err) {
          console.error(err);
        }
      }, (canBeWateredAt - time) * 1000)
    );
  }

  const growing = canBeWateredAt > time;

  const treeAge = growing
    ? (getTreeAge(ctx.game.pieces.length - 1) + time - ctx.game.lastWateredAt) * 1000
    : getTreeAge(ctx.game.pieces.length) * 1000;

  const embed = new EmbedBuilder().setTitle(ctx.game.name).setFooter({
    text: `Your community has spent ${humanizeDuration(treeAge)
      .replace("minute,", `minute${treeAge >= 3600000 ? `,` : ""} and`)
      .replace("minutes,", `minutes${treeAge >= 3600000 ? `,` : ""} and`)} growing this tree. Well done!`
  });

  embed.setImage(await renderTree(ctx.game));

  let description = starting
    ? "Congratulations, here's your tree!\n\nNow that you've planted it, press the 💧 button below for it to grow taller!\n\n"
    : "";

  const height = getTreeHeight(ctx.game);

  if (canBeWateredAt <= time) {
    description += `**Your tree is ${height}ft tall.**\n\nLast watered by: <@${ctx.game.lastWateredBy}>\n**Ready to be watered!**`;
  } else {
    description += `**Your tree is ${height}ft tall.**\n\n**Thanks <@${ctx.game.lastWateredBy}> for watering the tree!**\nIt's growing right now, come back <t:${canBeWateredAt}:R>.`;
  }

  embed.setDescription(description);

  message.addEmbeds(embed);

  return message;
}
