import { promises as fs } from "fs";
import { IMiddleware } from "botiful";
import { DATA_DIR, DATA_FILE, IBanData } from "../actions/ban";

export const banMiddleware: IMiddleware = {
    apply: (_action, msg, _bot) => {
        return fs.readFile(`${DATA_DIR}/${DATA_FILE}`, "utf-8")
            .then((str) => JSON.parse(str) as IBanData)
            .then((data) => {
                for (let x of data.bans) {
                    if (x.id === msg.author.id) return false;
                }
              return true;
            }).catch((err) => {
              console.error(`banCheck middleware failed: ${err}`);
              return false;
            });
    },
};
