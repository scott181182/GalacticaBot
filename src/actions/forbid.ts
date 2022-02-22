import { promises as fs } from "fs";
import { IAction } from "botiful";

export const DATA_DIR = process.cwd() + "/data";
export const DATA_FILE = "banned.json";

export type BanRecord = {
    id: string;
    authorizedBy: string;
    date: number;
};

export class BanData {
    bans: Array<BanRecord> = [];

    constructor() {
        return { bans: [] };
    }
}

export const forbidCommand: IAction = {
    name: "forbid",
    description:
        "Prevents all mentioned users from being able to use the bot",
    man:
        "**Forbid Command:**\n" +
        "`forbid`  `mentioned user` `...mentioned user`\n" +
        "_forbids all mentioned users from using the bot_\n" +
        "\n" +
        "**Examples:**\n" +
        "`forbid @UserOne` -- forbids 'UserOne'\n" +
        "`forbid @UserOne @UserTwo @UserThree` -- forbids 'UserOne', 'UserTwo', and 'UserThree'",
    admin: true,
    init: (bot) => {
        fs.open(`${DATA_DIR}/${DATA_FILE}`, "a")
            .then((fd) => fd.close())
            .catch((err) => {
                bot.log.error(
                    `Failed to create data file for the ban command: ${err}`
                );
            });
    },
    run: async (_args, msg, bot) => {
        fs.readFile(`${DATA_DIR}/${DATA_FILE}`, "utf-8")
            .then((strObj) => {
                if (strObj.length === 0) {
                    return new BanData();
                } else {
                    let banData = JSON.parse(strObj) as BanData;
                    if (!banData.bans) banData.bans = [];
                    return banData;
                }
            })
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
                bot.log.error(`Ban action failed: ${err}`);
            });
    },
};

export const unforbidCommand: IAction = {
    name: "unforbid",
    description: "Allows any previously forbade user to use the bot",
    man: 
        "**Unforbid Command:**\n" +
        "`unforbid`  `mentioned user` `...mentioned user`\n" +
        "_allows previously forbade users to use the bot\n" +
        "\n" +
        "**Examples:**\n" +
        "`unforbid @UserOne` -- Unforbids 'UserOne'\n" +
        "`unforbid @UserOne @UserTwo @UserThree` -- Unforbids 'UserOne', 'UserTwo', and 'UserThree'",
    admin: true,
    run: async (_args, msg, bot) => {
        fs.readFile(`${DATA_DIR}/${DATA_FILE}`, "utf-8")
            .then((strObj) => {
                if (strObj.length === 0) {
                    return new BanData();
                } else {
                    return JSON.parse(strObj) as BanData;
                }
            })
            // Remove the previously banned users from the ban list
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
                bot.log.error(`Ban action failed: ${err}`);
            });
    },
};
