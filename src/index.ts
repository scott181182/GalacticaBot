import { promises as fs } from "fs";
import * as path from "path";

import { DiscordBot, IAction } from "botiful";
import { getVoiceConnections } from "@discordjs/voice";

import { audioCommand } from "./actions/audio";
import { jsCommand } from "./actions/exec";
import { ytCommand } from "./actions/yt";
import { Intents } from "discord.js";

import { banCheck } from "./middleware/ban";



const CONFIG_PATH = path.resolve(__dirname, "..", "private", "config.json");


const BOT_ACTIONS: IAction[] = [
    audioCommand,
    jsCommand,
    ytCommand
];

(async function main()
{
    console.log("Starting bot...");
    const config = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8"));
    const bot = new DiscordBot({
        ...config,
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.DIRECT_MESSAGES,
            Intents.FLAGS.GUILD_VOICE_STATES
        ]
    });

    process.on('uncaughtException', (err) => {
        bot.log.error("Uncaught exception!");
        // tslint:disable-next-line:no-console
        console.error(err);
        // bot.log.error(err);
    });

    process.on('SIGINT', async () => {
        const voxConnections = await getVoiceConnections();
        voxConnections.forEach(connection => connection.disconnect());
        await bot.logout();
        bot.log.info("Exiting process...");
        process.exit(0);
    });

    bot.loadActions(BOT_ACTIONS);

    // bot.loadMiddleware({
    //     apply: (action) => {
    //         return !action.admin
    //     }
    // });

    bot.loadMiddleware(banCheck);

    bot.log.debug(bot.getActions()
        .map(action => action.name)
        .join(", "));

    await bot.start();
    console.log("Started!");
})();
