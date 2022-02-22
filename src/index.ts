import { promises as fs } from "fs";
import * as path from "path";

import { DiscordBot, IAction, IMiddleware } from "botiful";
import { Intents } from "discord.js";
import { getVoiceConnections } from "@discordjs/voice";

import { audioCommand } from "./actions/audio";
import { forbidCommand, unforbidCommand } from "./actions/forbid";
import { jsCommand } from "./actions/exec";
import { rollCommand } from "./actions/roll";
import { ytCommand } from "./actions/yt";

import { forbidMiddleware } from "./middleware/forbid";

import { getConfig } from "./config";

const CONFIG_PATH = path.resolve(__dirname, "..", "private", "config.json");

const BOT_ACTIONS: IAction[] = [
    audioCommand,
    forbidCommand,
    unforbidCommand,
    jsCommand,
    rollCommand,
    ytCommand,
];

const BOT_MIDDLEWARE: IMiddleware[] = [forbidMiddleware];

(async function main() {
    console.log("Starting bot...");
    const bot = new DiscordBot(await getConfig());

    process.on("uncaughtException", (err) => {
        bot.log.error("Uncaught exception!");
        // tslint:disable-next-line:no-console
        console.error(err);
        // bot.log.error(err);
    });

    process.on("SIGINT", async () => {
        const voxConnections = await getVoiceConnections();
        voxConnections.forEach((connection) => connection.disconnect());
        await bot.logout();
        bot.log.info("Exiting process...");
        process.exit(0);
    });

    bot.loadActions(BOT_ACTIONS);
    bot.loadMiddleware(BOT_MIDDLEWARE);

    bot.log.debug(
        bot
            .getActions()
            .map((action) => action.name)
            .join(", ")
    );

    // bot.log.debug(bot.getMiddleware()
    //     .map(mw => mw.name)
    //     .join(", "));

    await bot.start();
    console.log("Started!");
})();
