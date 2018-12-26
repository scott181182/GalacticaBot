import { DiscordBot } from "botiful";

(async function main()
{
    const bot = new DiscordBot("private/config.json");

    process.on('uncaughtException', (err) => {
        bot.log.error(err);
    });

    process.on('SIGINT', async () => {
        bot.client.voiceConnections.forEach(connection => connection.disconnect());
        await bot.logout();
        bot.log.info("Exiting process...");
        process.exit(0);
    });

    bot.log.debug(`Action Directory: ${__dirname}/actions`);
    bot.load_actions(`${__dirname}/actions`);
    bot.log.debug(bot.actions()
        .map(action => action.name)
        .join(", "));

    await bot.start();
})();
