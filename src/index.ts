import "dotenv/config";
import fastify from "fastify";
import rawBody from "fastify-raw-body";
import {
  AutocompleteContext,
  DiscordApplication,
  InteractionContext,
  InteractionHandlerTimedOut,
  PingContext,
  SimpleError,
  UnauthorizedInteraction,
  UnknownApplicationCommandType,
  UnknownComponentType,
  UnknownInteractionType
} from "interactions.ts";
import { connect, HydratedDocument } from "mongoose";
import { createClient } from "redis";
import {
  About,
  Config,
  Forest,
  Help,
  Leaderboard,
  Ping,
  Plant,
  Profile,
  Rename,
  Tree,
  UserContextProfile
} from "./commands";
import { Guild, ITree } from "./models/Guild";
import { IPlayer, Player } from "./models/Player";

declare module "interactions.ts" {
  interface BaseInteractionContext {
    player: HydratedDocument<IPlayer>;
    game: HydratedDocument<ITree> | null;
    timeouts: Map<string, NodeJS.Timeout>;
  }
}

const timeouts = new Map();
const keys = ["CLIENT_ID", "TOKEN", "PUBLIC_KEY", "PORT"];

if (keys.some((key) => !(key in process.env))) {
  console.error(`Missing Enviroment Variables`);
  process.exit(1);
}

(async () => {
  const redisClient = createClient({
    url: "redis://redis"
  });

  await redisClient.connect();

  const app = new DiscordApplication({
    clientId: process.env.CLIENT_ID as string,
    token: process.env.TOKEN as string,
    publicKey: process.env.PUBLIC_KEY as string,

    cache: {
      get: (key: string) => redisClient.get(key),
      set: (key: string, ttl: number, value: string) => redisClient.setEx(key, ttl, value)
    },

    hooks: {
      interaction: async (ctx: InteractionContext) => {
        if (ctx instanceof PingContext) return;
        if (!ctx.interaction.guild_id) return;

        let player;
        let game;

        try {
          game = await Guild.findOne({ id: ctx.interaction.guild_id });

          if (game) await game.populate("contributors");

          player = await Player.findOne({ id: ctx.user.id });

          if (!player) {
            player = new Player({ id: ctx.user.id });
            await player.save();
          }
        } catch (err) {
          console.error(err);

          if (ctx instanceof AutocompleteContext) {
            await ctx.reply([]);
          } else {
            await ctx.reply(SimpleError("There was an error loading your game data"));
          }

          return true;
        }

        ctx.decorate("player", player);
        ctx.decorate("game", game);

        ctx.decorate("timeouts", timeouts);
      }
    }
  });

  await app.commands.register(
    [
      new Ping(),
      new Plant(),
      new Tree(),
      new Leaderboard(),
      new Forest(),
      new Profile(),
      new UserContextProfile(),
      new About(),
      new Rename(),
      new Config(),
      new Help()
    ],
    false
  );

  const server = fastify();
  server.register(rawBody);

  server.post("/", async (request, reply) => {
    const signature = request.headers["x-signature-ed25519"];
    const timestamp = request.headers["x-signature-timestamp"];

    if (typeof request.rawBody !== "string" || typeof signature !== "string" || typeof timestamp !== "string") {
      return reply.code(400).send({
        error: "Invalid request"
      });
    }

    try {
      await app.handleInteraction(
        async (response) => {
          reply.code(200).send(response);
        },
        request.rawBody,
        timestamp,
        signature
      );
    } catch (err) {
      if (err instanceof UnauthorizedInteraction) {
        console.error("Unauthorized Interaction");
        return reply.code(401).send();
      }

      if (err instanceof InteractionHandlerTimedOut) {
        console.error("Interaction Handler Timed Out");

        return reply.code(408).send();
      }

      if (
        err instanceof UnknownInteractionType ||
        err instanceof UnknownApplicationCommandType ||
        err instanceof UnknownComponentType
      ) {
        console.error("Unknown Interaction - Library may be out of date.");
        console.dir(err.interaction);

        return reply.code(400).send();
      }

      console.error(err);
    }
  });

  connect(`mongodb://mongo/trees`)
    .then(async () => {
      const address = "0.0.0.0";
      const port = process.env.PORT as string;

      await updateGuilds();

      server.listen(port, address);
      console.log(`Listening for interactions on ${address}:${port}.`);
    })
    .catch((err: unknown) => {
      console.error(err);
    });
})();

async function updateGuilds() {
  const trees = await Guild.find({});

  for (const tree of trees) {
    if (tree.size >= 6) tree.background = "Sky";
    if (tree.size >= 750) tree.background = "SpaceEdge";

    await tree.save();
  }
}
