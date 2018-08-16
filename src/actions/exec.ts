import { IAction } from "botiful";

import { exec as exec_async } from "child_process";

export const js: IAction = {
    name: "js",
    description: "Executes javascript code.",
    admin: true,
    run: async (args, msg, bot) => {
        let result: any = "An error occured during execution of your code";
        const script = msg.cleanContent.substr(msg.cleanContent.indexOf(' '));
        try {
            bot.log.debug(`Exec: '${script}'`);
            // tslint:disable-next-line:no-eval
            result = eval(script);
            if(result instanceof Object) { result = JSON.stringify(result); }
            else if(result.length === 0) { result = "Success!"; }

            await msg.channel.send(result as string, { code: true });
        } catch(err) {
            bot.log.error(err);
            await msg.channel.send(`An error occured trying to execute your script:\n${err}`, { code: true });
        }
    }
};

export const exec: IAction = {
    name: 'exec',
    description: 'Executes a command.',
    admin: true,

    run: (args, msg, bot) => {
        return new Promise((resolve) => {
            const cmd = msg.cleanContent.substr(msg.cleanContent.indexOf(' '));
            exec_async(cmd, { timeout: 5000 }, async (err, stdout, stderr) => {
                if(err) {
                    bot.log.error(err);
                    await msg.channel.send(`An error occurred trying to execute your command`, { code: true });
                }
                if(stderr) {
                    await msg.channel.send(`Error:\n${stderr}`, { code: true });
                }
                if(stdout) {
                    await msg.channel.send(stdout, { code: true });
                }
                resolve();
            });
        }) as Promise<void>;
    }
};
