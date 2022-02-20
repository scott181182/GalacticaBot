import { IAction } from "botiful";

import { exec as exec_async } from "child_process";

export const jsCommand: IAction = {
    name: "js",
    description: "Executes javascript code.",
    admin: true,
    run: async (args, msg, bot) => {
        let result: any = "An error occured during execution of your code";
        if(!msg.cleanContent) {
            msg.channel.send("Error: could not get clean content of script");
            return;
        }
        const script = msg.cleanContent.substring(msg.cleanContent.indexOf(' ') + 1);
        try {
            bot.log.debug(`Exec: '${script}'`);
            // tslint:disable-next-line:no-eval
            result = eval(script);
            if(typeof result !== "string") { result = JSON.stringify(result); }
            else if(result.length === 0) { result = "Success!"; }
            result = `\`\`\`\n${result}\`\`\``;
            await msg.channel.send({ content: result });
        } catch(err) {
            bot.log.error(err);
            await msg.channel.send(`An error occured trying to execute your script:\n\`\`\`\n${err}\`\`\``);
        }
    }
};

// Not a good idea.
// export const exec: IAction = {
//     name: 'exec',
//     description: 'Executes a command.',
//     admin: true,

//     run: (args, msg, bot) => {
//         return new Promise((resolve) => {
//             if(!msg.cleanContent) {
//                 msg.channel.send("Error: could not get clean content of script");
//                 return;
//             }
//             const cmd = msg.cleanContent.substring(msg.cleanContent.indexOf(' '));
//             exec_async(cmd, { timeout: 5000 }, async (err, stdout, stderr) => {
//                 if(err) {
//                     bot.log.error(err);
//                     await msg.channel.send(`\`An error occurred trying to execute your command\``);
//                 }
//                 if(stderr) {
//                     await msg.channel.send(`Error:\n\`\`\`\n${stderr}\`\`\``);
//                 }
//                 if(stdout) {
//                     stdout = `\`\`\`\n${stdout}\`\`\``;
//                     await msg.channel.send(stdout);
//                 }
//                 resolve();
//             });
//         }) as Promise<void>;
//     }
// };
