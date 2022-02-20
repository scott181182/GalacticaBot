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

export const banCommand: IAction = {
    name: "ban",
    description:
        "Prevents all mentioned users from being able to use GalacticaBot",
    man: "!ban @UserName (@AndSoOn...)",
    admin: true,
    init: (bot) => {
        fs.open(`${DATA_DIR}/${DATA_FILE}`, "wx").catch((err) => {
            bot.log.error(
                `Failed to create data file for the ban command: ${err}`
            );
        });
    },
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

export const unbanCommand: IAction = {
    name: "unban",
    description: "Allows any previously banned user to use GalacticaBot",
    man: "!unban @UserName (@AndSoOn...)",
    admin: true,
    run: async (_args, msg, _bot) => {
        fs.readFile(`${DATA_DIR}/${DATA_FILE}`, "utf-8")
            .then((strObj) => JSON.parse(strObj) as IBanData)
            // Dedup the to-be banned users by those already in the ban list
            .then((data) => {
                let users = msg.mentions.users;
                for (let [snowflake, u] of users) {
                    let index = data.bans.findIndex((x) => x.id === snowflake);
                    data.bans.splice(index, 1);
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
