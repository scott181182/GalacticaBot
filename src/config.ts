import { promises as fs } from "fs";
import * as path from "path";
import { default_config, IDiscordBotConfig } from "botiful/lib/config";
import { Intents } from "discord.js";
import { rejects } from "assert";
import { getServers } from "dns";

const PRIVATE_PATH = getPrivatePath();
const CONFIG_PATH = PRIVATE_PATH + "/" + "config.json";

function getPrivatePath() {
    if (process.env.BOT_PRIVATE_DIR) {
        return path.resolve(process.cwd(), process.env.BOT_PRIVATE_DIR);
    } else {
        return path.resolve(process.cwd(), "private/");
    }
}

export interface IBotConfig extends IDiscordBotConfig {}
const DEFAULT_CONFIG: IBotConfig = {
    token: "REPLACE_WITH_TOKEN",
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
    ],
    ...default_config,
};

/**
 * Reads the config file and parses it. If the configuration is missing this will
 * generate a config file with the default settings.
 *
 * @returns The bot's configuration object
 */
export async function getConfig(): Promise<IBotConfig> {
    return fs
        .readFile(CONFIG_PATH, "utf8")
        .then((serConfig) => {
            const config: IBotConfig = JSON.parse(serConfig);
            if (!config) {
                console.warn("Empty config object!");
                return writeDefaultConfig().then((_) => DEFAULT_CONFIG);
            } else {
                return config;
            }
        })
        .catch((err) => {
            if (err.code === "ENOENT") {
                console.error("Missing config file!");
                return writeDefaultConfig().then((_) => DEFAULT_CONFIG);
            } else {
                return Promise.reject(err);
            }
        });
}

function writeDefaultConfig(): Promise<void> {
    const serConfig = JSON.stringify(DEFAULT_CONFIG, null, 4);
    return fs
        .access(PRIVATE_PATH)
        .catch((err) => {
            if (err.code === "EEXIST") return Promise.resolve();
            else return fs.mkdir(PRIVATE_PATH);
        })
        .then((_) => {
            return fs.writeFile(CONFIG_PATH, serConfig)
                .then((_) => {
                    console.info(
                        `Wrote default configuration to file '${CONFIG_PATH}'`
                    );
                })
                .catch((err) => {
                    console.error(
                        `Failed to write configuration file!\n${err}`
                    );
                });
        });
}
