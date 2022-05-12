import { HydratedDocument } from "mongoose";
import fetch from "node-fetch";
import { ITree } from "../models/Guild";

const IMAGE_SERVER = "http://image-server:9090/";
const SHOW_LAST_X_BLOCKS = 5;

export async function renderTree(tree: HydratedDocument<ITree>, full = false): Promise<string> {
  return full
    ? fetchImage("fullTree", {
        id: tree.id,
        pieces: tree.pieces
      })
    : fetchImage("treetop", {
        id: tree.id,
        pieces: tree.pieces.slice(-SHOW_LAST_X_BLOCKS)
      });
}

async function fetchImage(path: string, data: unknown): Promise<string> {
  try {
    const result = await fetch(IMAGE_SERVER + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(data)
    });

    if (!result.ok) {
      console.log(await result.text());
      throw new Error(`Failed to fetch image: ${result.statusText}`);
    }

    const image = await result.json();

    return image.url;
  } catch (err) {
    console.error(err);

    return "https://www.clipartmax.com/png/full/224-2247501_%C2%A0-tree-transparent.png";
  }
}
