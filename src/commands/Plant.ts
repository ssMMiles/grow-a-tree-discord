import {
  ActionRowBuilder,
  Button,
  ButtonBuilder,
  ButtonContext,
  ButtonStyle,
  EmbedBuilder,
  ISlashCommand,
  MessageBuilder,
  PermissionBits,
  SimpleError,
  SlashCommandBuilder,
  SlashCommandContext,
  SlashCommandStringOption
} from "interactions.ts";
import { Guild } from "../models/Guild";
import { generateNextSegment } from "../util/tree-generation";
import { validateTreeName } from "../util/validate-tree-name";
import { buildTreeDisplayMessage } from "./Tree";

type State = {
  name: string;
};

export class Plant implements ISlashCommand {
  public builder = new SlashCommandBuilder("plant", "Plant a tree for your server.")
    .addStringOption(new SlashCommandStringOption("name", "A name for your server's tree.").setRequired(true))
    .setDMEnabled(false)
    .addRequiredPermissions(PermissionBits.ADMINISTRATOR);

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    if (ctx.game !== null)
      return ctx.reply(SimpleError(`A tree has already been planted in this server called \`\`${ctx.game.name}\`\`.`));

    const name = ctx.getStringOption("name").value;

    if (!validateTreeName(name))
      return ctx.reply(
        SimpleError(
          "Your tree name must be 1-36 characters, and contain only alphanumeric characters, hyphens, and apostrophes."
        )
      );

    return ctx.reply(
      new MessageBuilder(
        new EmbedBuilder(
          `Are you sure you want to call your tree \`\`${name}\`\`?`,
          `*Your tree name is public, so please avoid any profanity/nsfw/links.* ***Thanks! :)***`
        ).setFooter({
          text: "If there is a problem the name will first be changed along with a warning, repeat offenses will have it locked to something boring."
        })
      ).addComponents(
        new ActionRowBuilder().addComponents(
          await ctx.createComponent("confirm", { name }),
          await ctx.createComponent("cancel")
        )
      )
    );
  };

  public components = [
    new Button(
      "confirm",
      new ButtonBuilder().setEmoji({ name: "✔️" }).setStyle(ButtonStyle.Success),
      async (ctx: ButtonContext<State>) => {
        if (ctx.game !== null)
          return ctx.reply(`A tree has already been planted in this server called \`\`${ctx.game.name}\`\`.`);

        const name = ctx.state?.name as string;

        ctx.game = new Guild({
          id: ctx.interaction.guild_id,

          name,

          lastWateredAt: Math.floor(Date.now() / 1000),
          lastWateredBy: ctx.user.id,

          pieces: [7, 0],

          contributors: [
            {
              userId: ctx.user.id,
              count: 1
            }
          ]
        });

        ctx.game.size = ctx.game.pieces.push(generateNextSegment(ctx.game));

        await ctx.game.save();

        ctx.parentCommand = "tree";

        await ctx.reply(await buildTreeDisplayMessage(ctx as ButtonContext<never>, true));
      }
    ),
    new Button(
      "cancel",
      new ButtonBuilder().setEmoji({ name: "✖️" }).setStyle(ButtonStyle.Danger),
      async (ctx: ButtonContext<State>) => {
        await ctx.reply(SimpleError("Cancelled.").setComponents([]));
      }
    )
  ];
}
