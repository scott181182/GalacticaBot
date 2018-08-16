import { DiscordBot } from "botiful";
import { TextChannel } from "discord.js";

(function main()
{
    const bot = new DiscordBot("private/config.json");

    process.on('uncaughtException', (err) => {
        bot.log.error(err);
    });

    process.on('SIGINT', () => {
        bot.logout();
    });

    bot.log.info(`${__dirname}/actions`);
    bot.load_actions(`${__dirname}/actions`);

    bot.start().then(() => {
        const dev_chan = bot.client.guilds.first().channels
            .find(chan => chan.name === "developers") as TextChannel;
    });
})();
