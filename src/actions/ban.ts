import { promises as fs } from "fs";
import { IAction } from "botiful";

export const DATA_DIR = process.cwd() + "/data";
export const DATA_FILE = "banned.json";

export interface IBanData {
    bans: [
        {
            id: string;
            authorizedBy: string;
            date: number;
        }
    ];
}

export const ban: IAction = {
    name: "ban",
    description:
        "Prevents all mentioned users from being able to use GalacticaBot",
    man: "!ban @UserName",
    admin: true,
    run: async (_args, msg, _bot) => {
        fs.readFile(`${DATA_DIR}/${DATA_FILE}`, "utf-8")
            .then((strObj) => JSON.parse(strObj) as IBanData)
            // Dedup the to-be banned users by those already in the ban list
            .then((data) => {
                let users = msg.mentions.users;
                for (let u of data.bans) {
                    if (users.has(u.id)) users.delete(u.id);
                }
                return { data, users };
            })
            // Concat the non-duplicates and the ban list
            .then(({ data, users }) => {
                for (let [snowflake, user] of users) {
                    let banRecord = {
                        id: snowflake,
                        authorizedBy: msg.author.id,
                        date: Date.now(),
                    };
                    data.bans.push(banRecord);
                }
                return data;
            })
            // Write banlist to disk
            .then((data) => {
                let serData = JSON.stringify(data);
                fs.writeFile(`${DATA_DIR}/${DATA_FILE}`, serData);
            })
            .catch((err) => {
                //TODO: Change to use bot.log
                console.error(`Ban action failed: ${err}`);
            });
    },
};