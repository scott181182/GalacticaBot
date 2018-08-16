import { DiscordBot } from "botiful";
import { TextChannel } from "discord.js";

(function main()
{
    const bot = new DiscordBot("private/config.json");
    bot.start().then(() => {
        const dev_chan = bot.client.guilds.first().channels
            .find(chan => chan.name === "developers") as TextChannel;
        dev_chan.send("Now I'm in my own package!");
        return bot.logout();
    });
})();
