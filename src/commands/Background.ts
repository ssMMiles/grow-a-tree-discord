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
  SimpleEmbed,
  SlashCommandBuilder,
  SlashCommandContext
} from "interactions.ts";

type State = {
  background: string;
};

const backgrounds: { [key: string]: number } = {
  Ground: 0,
  Sky: 5,
  SpaceEdge: 1000
};

const backgroundNames = Object.keys(backgrounds);

export class Background implements ISlashCommand {
  public builder = new SlashCommandBuilder("background", "Change your tree's background.")
    .setDMEnabled(false)
    .addRequiredPermissions(PermissionBits.ADMINISTRATOR);

  public handler = async (ctx: SlashCommandContext): Promise<void> => {
    return ctx.reply(await buildBackgroundMenu(ctx));
  };

  public components = [
    new Button(
      "set",
      new ButtonBuilder(ButtonStyle.Primary).setEmoji({ name: "🖌️" }).setStyle(1),
      async (ctx: ButtonContext<State>) => {
        if (!ctx.state || !ctx.game) return;

        await ctx.defer();

        ctx.game.background = ctx.state.background;
        await ctx.game.save();

        await ctx.send(SimpleEmbed("Background set. Use ``/tree`` to take a look!").setEphemeral(true));
      }
    ),
    new Button(
      "back",
      new ButtonBuilder().setEmoji({ name: "◀️" }).setStyle(2),
      async (ctx: ButtonContext<State>): Promise<void> => {
        if (!ctx.state) return;

        const position = backgroundNames.indexOf(ctx.state.background);
        ctx.state.background = backgroundNames[position - 1];

        return ctx.reply(await buildBackgroundMenu(ctx));
      }
    ),
    new Button(
      "next",
      new ButtonBuilder().setEmoji({ name: "▶️" }).setStyle(2),
      async (ctx: ButtonContext<State>): Promise<void> => {
        if (!ctx.state) return;

        const position = backgroundNames.indexOf(ctx.state.background);
        ctx.state.background = backgroundNames[position + 1];

        return ctx.reply(await buildBackgroundMenu(ctx));
      }
    )
  ];
}

async function buildBackgroundMenu(ctx: SlashCommandContext | ButtonContext<State>): Promise<MessageBuilder> {
  if (ctx.game === null) return SimpleEmbed("Use /plant to plant a tree for your server first.").setEphemeral(true);

  const background = "state" in ctx ? ctx.state!.background : ctx.game.background;

  let originalPosition = -1;
  for (const name of backgroundNames) {
    if (backgrounds[name] <= ctx.game.size) originalPosition++;
  }

  const position = backgroundNames.indexOf(background);

  const embed = new EmbedBuilder(
    "Backgrounds",
    `
      As your tree grows, you'll notice the background change at certain height milestones. 
      
      Here you can view all stages you've unlocked, and switch back to one if you'd like.
      `
  );

  if (position > originalPosition) {
    embed.setDescription(`You'll unlock this next stage at ${backgrounds[background]}ft.`);
    embed.setImage(`https://cdn.milesmoonlove.com/trees/backgrounds/Locked.png`);

    return new MessageBuilder(embed)
      .addComponents(
        new ActionRowBuilder([
          (await ctx.createComponent("set", "state" in ctx ? ctx.state : { background })).setDisabled(true),
          await ctx.createComponent("back", "state" in ctx ? ctx.state : { background }),
          (await ctx.createComponent("next", "state" in ctx ? ctx.state : { background })).setDisabled(true)
        ])
      )
      .setEphemeral(true);
  }

  embed.setImage(`https://cdn.milesmoonlove.com/trees/backgrounds/${backgroundNames[position]}.png`);

  const buttons = new ActionRowBuilder([await ctx.createComponent("set", "state" in ctx ? ctx.state : { background })]);

  const back = await ctx.createComponent("back", "state" in ctx ? ctx.state : { background });
  const next = await ctx.createComponent("next", "state" in ctx ? ctx.state : { background });

  if (position === 0) {
    back.setDisabled(true);
  }

  if (position === backgroundNames.length - 1) {
    next.setDisabled(true);

    if (position === originalPosition) {
      embed.setFooter({
        text: "Congratulations! You've unlocked all backgrounds! We're working on adding more, join our Discord server to be notified when this happens.."
      });
    }
  }

  buttons.addComponents(back, next);

  return new MessageBuilder(embed).addComponents(buttons).setEphemeral(true);
}
